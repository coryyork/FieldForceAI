import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { AIService } from './aiService';
import { storage } from '../storage';
import { AI_MODELS } from '../config/aiModels';
import { buildVoiceInstructions, getVoiceId } from './aiPrompts';

const OPENAI_REALTIME_URL = `wss://api.openai.com/v1/realtime?model=${AI_MODELS.realtime}`;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const aiService = new AIService();

interface VoiceSession {
  clientWs: WebSocket;
  providerWs: WebSocket | null;
  userId: string;
  companyId: string;
}

const activeSessions = new Map<string, VoiceSession>();

export function handleVoiceWebSocket(ws: WebSocket, request: IncomingMessage, userId: string, companyId: string) {
  const sessionId = `${userId}-${Date.now()}`;
  
  console.log(`Voice session started: ${sessionId}`);

  const session: VoiceSession = {
    clientWs: ws,
    providerWs: null,
    userId,
    companyId,
  };
  
  activeSessions.set(sessionId, session);
  
  const messageQueue: any[] = [];

  connectToOpenAI(session, messageQueue);

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      
      if (data.type === 'input_audio_buffer.append') {
        console.log('Received audio chunk from client, size:', data.audio?.length || 0);
      } else if (data.type === 'input_audio_buffer.commit') {
        console.log('Committing audio buffer to OpenAI Realtime');
      } else {
        console.log('Received client message:', data.type);
      }
      
      if (session.providerWs && session.providerWs.readyState === WebSocket.OPEN) {
        session.providerWs.send(JSON.stringify(data));
      } else {
        console.log('OpenAI Realtime connection not ready, queueing message:', data.type);
        messageQueue.push(data);
      }
    } catch (error) {
      console.error('Error handling client message:', error);
      ws.send(JSON.stringify({
        type: 'error',
        error: 'Failed to process message'
      }));
    }
  });

  ws.on('close', (code, reason) => {
    console.log(`Voice session ended: ${sessionId}, code: ${code}, reason: ${reason}`);
    
    if (session.providerWs) {
      session.providerWs.close();
    }
    
    activeSessions.delete(sessionId);
  });

  ws.on('error', (error) => {
    console.error(`Client WebSocket error for session ${sessionId}:`, error);
  });
}

function connectToOpenAI(session: VoiceSession, messageQueue: any[]) {
  if (!OPENAI_API_KEY) {
    session.clientWs.send(JSON.stringify({
      type: 'error',
      error: 'OpenAI API key not configured. Set OPENAI_API_KEY to enable OpenAI Realtime.'
    }));
    return;
  }

  void (async () => {
    try {
      const aiSettings = await storage.getAISettings(session.companyId);

      const providerWs = new WebSocket(OPENAI_REALTIME_URL, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'realtime=v1',
        }
      });

      session.providerWs = providerWs;

      providerWs.on('open', () => {
        console.log(`Connected to OpenAI Realtime API (${AI_MODELS.realtime})`);

        const sessionConfig = {
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            voice: getVoiceId(aiSettings),
            instructions: buildVoiceInstructions(aiSettings),
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: { model: 'whisper-1' },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500,
            },
            tools: [
              {
                type: 'function',
                name: 'search_knowledge_base',
                description: 'Search through the business knowledge base including leads, documents, tasks, job openings, and activities. Use this whenever the user asks about their business data, recent activities, recruitment information, or needs information from their documents.',
                parameters: {
                  type: 'object',
                  properties: {
                    query: {
                      type: 'string',
                      description: 'The search query to find relevant business data'
                    }
                  },
                  required: ['query']
                }
              }
            ],
          }
        };

        providerWs.send(JSON.stringify(sessionConfig));

        if (messageQueue.length > 0) {
          console.log(`Processing ${messageQueue.length} queued messages`);
          messageQueue.forEach(data => {
            if (data.type !== 'session.update') {
              providerWs.send(JSON.stringify(data));
            }
          });
          messageQueue.length = 0;
        }

        session.clientWs.send(JSON.stringify({
          type: 'connection',
          status: 'connected',
          aiName: aiSettings?.aiName || 'AI Assistant',
        }));
      });

    providerWs.on('message', async (data: WebSocket.Data) => {
      try {
        const message = data.toString();
        const parsedMessage = JSON.parse(message);
        
        if (parsedMessage.type === 'session.created') {
          console.log('OpenAI Realtime session created:', parsedMessage.session);
        } else if (parsedMessage.type === 'session.updated') {
          console.log('OpenAI Realtime session updated successfully');
        } else if (parsedMessage.type === 'input_audio_buffer.speech_started') {
          console.log('Speech detected by OpenAI Realtime');
          session.clientWs.send(JSON.stringify({
            type: 'speech_started'
          }));
        } else if (parsedMessage.type === 'input_audio_buffer.speech_stopped') {
          console.log('Speech stopped, OpenAI Realtime processing...');
        } else if (parsedMessage.type === 'input_audio_buffer.committed') {
          console.log('Audio buffer committed');
        } else if (
          parsedMessage.type === 'conversation.item.input_audio_transcription.completed' ||
          parsedMessage.type === 'conversation.item.input_audio_transcription.updated'
        ) {
          session.clientWs.send(JSON.stringify({
            type: 'transcript',
            text: parsedMessage.transcript || '',
            role: 'user'
          }));
        } else if (parsedMessage.type === 'conversation.item.created') {
          const role = parsedMessage.item?.role || 'user';
          session.clientWs.send(JSON.stringify({
            type: 'transcript',
            text: parsedMessage.item?.content?.[0]?.transcript || '',
            role: role
          }));
        } else if (parsedMessage.type === 'response.function_call_arguments.done') {
          console.log('Function call requested:', parsedMessage);
          if (parsedMessage.name === 'search_knowledge_base') {
            try {
              const args = JSON.parse(parsedMessage.arguments);
              console.log('Searching knowledge base with query:', args.query);
              
              const searchResults = await aiService.searchBusinessData(session.companyId, args.query);
              
              let responseText = '';
              const analysis = searchResults.analysis;
              
              if (analysis.summary) {
                responseText = analysis.summary + '\n\n';
              }
              
              if (analysis.relevantResults) {
                const { leads, documents, tasks, jobOpenings } = analysis.relevantResults;
                
                if (leads && leads.length > 0) {
                  responseText += `I found ${leads.length} relevant lead${leads.length > 1 ? 's' : ''}. `;
                  leads.slice(0, 3).forEach((lead: any) => {
                    responseText += `${lead.name} from ${lead.company || 'unknown company'} in ${lead.stage} stage. `;
                  });
                }
                
                if (documents && documents.length > 0) {
                  responseText += `I found ${documents.length} relevant document${documents.length > 1 ? 's' : ''}. `;
                  documents.slice(0, 3).forEach((doc: any) => {
                    responseText += `${doc.title}. `;
                  });
                }
                
                if (tasks && tasks.length > 0) {
                  responseText += `I found ${tasks.length} relevant task${tasks.length > 1 ? 's' : ''}. `;
                  tasks.slice(0, 3).forEach((task: any) => {
                    responseText += `${task.title} with ${task.priority} priority, status: ${task.status}. `;
                  });
                }
                
                if (jobOpenings && jobOpenings.length > 0) {
                  responseText += `I found ${jobOpenings.length} job opening${jobOpenings.length > 1 ? 's' : ''}. `;
                  jobOpenings.slice(0, 3).forEach((job: any) => {
                    responseText += `${job.title} ${job.department ? `in ${job.department}` : ''} ${job.location ? `at ${job.location}` : ''}, status: ${job.status}. `;
                  });
                }
              }
              
              if (!responseText) {
                responseText = "I couldn't find any specific information matching your query in the knowledge base.";
              }
              
              const functionOutput = {
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: parsedMessage.call_id,
                  output: responseText
                }
              };
              
              console.log('Sending function output to OpenAI Realtime:', functionOutput);
              providerWs.send(JSON.stringify(functionOutput));
              providerWs.send(JSON.stringify({ type: 'response.create' }));
              
            } catch (error) {
              console.error('Error executing knowledge base search:', error);
              providerWs.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: parsedMessage.call_id,
                  output: 'I encountered an error searching the knowledge base. Please try again.'
                }
              }));
              providerWs.send(JSON.stringify({ type: 'response.create' }));
            }
          }
        } else if (
          parsedMessage.type === 'response.output_audio.delta' ||
          parsedMessage.type === 'response.audio.delta'
        ) {
          session.clientWs.send(JSON.stringify({
            type: 'audio',
            audio: parsedMessage.delta,
            itemId: parsedMessage.item_id
          }));
        } else if (
          parsedMessage.type === 'response.output_audio_transcript.delta' ||
          parsedMessage.type === 'response.audio_transcript.delta'
        ) {
          session.clientWs.send(JSON.stringify({
            type: 'transcript_delta',
            text: parsedMessage.delta,
            role: 'assistant'
          }));
        } else if (
          parsedMessage.type === 'response.output_audio_transcript.done' ||
          parsedMessage.type === 'response.audio_transcript.done'
        ) {
          session.clientWs.send(JSON.stringify({
            type: 'transcript',
            text: parsedMessage.transcript || '',
            role: 'assistant'
          }));
        } else if (parsedMessage.type === 'error') {
          console.error('OpenAI Realtime error:', parsedMessage.error);
          session.clientWs.send(JSON.stringify({
            type: 'error',
            error: parsedMessage.error?.message || 'OpenAI Realtime API error'
          }));
        } else {
          session.clientWs.send(message);
        }
      } catch (error) {
        console.error('Error processing OpenAI Realtime message:', error);
      }
    });

    providerWs.on('error', (error) => {
      console.error('OpenAI Realtime WebSocket error:', error);
      session.clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Connection to voice service failed'
      }));
    });

    providerWs.on('close', (code, reason) => {
      console.log(`OpenAI Realtime connection closed, code: ${code}, reason: ${reason}`);
      if (session.clientWs.readyState === WebSocket.OPEN) {
        session.clientWs.send(JSON.stringify({
          type: 'connection',
          status: 'disconnected'
        }));
      }
    });

    } catch (error) {
      console.error('Failed to connect to OpenAI Realtime:', error);
      session.clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Failed to establish voice connection'
      }));
    }
  })();
}

export function getActiveSessions(): number {
  return activeSessions.size;
}
