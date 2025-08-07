import WebSocket from 'ws';
import { IncomingMessage } from 'http';
import { AIService } from './aiService';
import { storage } from '../storage';

// OpenAI Realtime API configuration
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Initialize AI service for knowledge base access
const aiService = new AIService();

interface VoiceSession {
  clientWs: WebSocket;
  openaiWs: WebSocket | null;
  userId: string;
  companyId: string;
}

const activeSessions = new Map<string, VoiceSession>();

export function handleVoiceWebSocket(ws: WebSocket, request: IncomingMessage, userId: string, companyId: string) {
  const sessionId = `${userId}-${Date.now()}`;
  
  console.log(`Voice session started: ${sessionId}`);

  // Create session
  const session: VoiceSession = {
    clientWs: ws,
    openaiWs: null,
    userId,
    companyId,
  };
  
  activeSessions.set(sessionId, session);
  
  // Queue for messages received before OpenAI connection is ready
  const messageQueue: any[] = [];

  // Connect to OpenAI Realtime API
  connectToOpenAI(session, messageQueue);

  // Handle client messages
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      // Add ping/pong mechanism for keep-alive
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
        return;
      }
      
      // Log audio messages for debugging
      if (data.type === 'input_audio_buffer.append') {
        console.log('Received audio chunk from client, size:', data.audio?.length || 0);
      } else if (data.type === 'input_audio_buffer.commit') {
        console.log('Committing audio buffer to OpenAI');
      } else {
        console.log('Received client message:', data.type);
      }
      
      if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
        // Forward message to OpenAI
        session.openaiWs.send(JSON.stringify(data));
      } else {
        console.log('OpenAI connection not ready, queueing message:', data.type);
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

  // Handle client disconnect
  ws.on('close', (code, reason) => {
    console.log(`Voice session ended: ${sessionId}, code: ${code}, reason: ${reason}`);
    
    // Close OpenAI connection
    if (session.openaiWs) {
      session.openaiWs.close();
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
      error: 'OpenAI API key not configured'
    }));
    return;
  }

  try {
    // Connect to OpenAI Realtime API with authentication
    const openaiWs = new WebSocket(OPENAI_REALTIME_URL, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'realtime=v1'
      }
    });

    session.openaiWs = openaiWs;

    openaiWs.on('open', () => {
      console.log('Connected to OpenAI Realtime API');
      
      // Configure session with knowledge base access function
      const sessionConfig = {
        type: 'session.update',
        session: {
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
          tool_choice: 'auto',
          instructions: `You are an AI assistant for Field Force 2, a business management platform. You have access to the user's business knowledge base including:
            - CRM leads and customer information
            - Documents and knowledge base articles
            - Tasks and project management data
            - Job openings and recruitment information
            - Recent business activities
            
            Always use the search_knowledge_base function when the user asks about:
            - Their leads, customers, or sales pipeline
            - Documents or information in their knowledge base
            - Tasks, projects, or to-do items
            - Job openings, recruitment, or hiring information
            - Recent activities or business updates
            - Any specific business data or metrics
            
            Provide helpful, conversational responses based on the actual data from their knowledge base.`
        }
      };
      
      // Send session configuration
      openaiWs.send(JSON.stringify(sessionConfig));
      
      // Process any queued messages
      if (messageQueue.length > 0) {
        console.log(`Processing ${messageQueue.length} queued messages`);
        messageQueue.forEach(data => {
          console.log('Sending queued message to OpenAI:', data.type);
          if (data.type === 'session.update') {
            // Merge tools with any custom session settings
            if (data.session) {
              data.session.tools = sessionConfig.session.tools;
              data.session.tool_choice = 'auto';
              // Append knowledge base instructions to custom instructions
              const customInstructions = data.session.instructions || '';
              data.session.instructions = customInstructions + '\n\n' + sessionConfig.session.instructions;
            }
            console.log('Session update details:', JSON.stringify(data.session, null, 2));
          }
          openaiWs.send(JSON.stringify(data));
        });
        messageQueue.length = 0; // Clear the queue
      }
      
      // Notify client of successful connection
      session.clientWs.send(JSON.stringify({
        type: 'connection',
        status: 'connected'
      }));
    });

    openaiWs.on('message', async (data: WebSocket.Data) => {
      try {
        // Forward OpenAI responses to client
        const message = data.toString();
        const parsedMessage = JSON.parse(message);
        
        // Handle different message types from OpenAI
        if (parsedMessage.type === 'session.created') {
          console.log('OpenAI session created:', parsedMessage.session);
        } else if (parsedMessage.type === 'session.updated') {
          console.log('OpenAI session updated successfully');
        } else if (parsedMessage.type === 'input_audio_buffer.speech_started') {
          console.log('Speech detected by OpenAI');
          // Notify client that user started speaking (to stop AI audio)
          session.clientWs.send(JSON.stringify({
            type: 'speech_started'
          }));
        } else if (parsedMessage.type === 'input_audio_buffer.speech_stopped') {
          console.log('Speech stopped, OpenAI processing...');
        } else if (parsedMessage.type === 'input_audio_buffer.committed') {
          console.log('Audio buffer committed');
        } else if (parsedMessage.type === 'conversation.item.input_audio_transcription.completed') {
          // User's spoken input transcript
          session.clientWs.send(JSON.stringify({
            type: 'transcript',
            text: parsedMessage.transcript || '',
            role: 'user'
          }));
        } else if (parsedMessage.type === 'conversation.item.created') {
          // Forward transcripts and responses
          const role = parsedMessage.item?.role || 'user';
          session.clientWs.send(JSON.stringify({
            type: 'transcript',
            text: parsedMessage.item?.content?.[0]?.transcript || '',
            role: role
          }));
        } else if (parsedMessage.type === 'response.function_call_arguments.done') {
          // Handle function calls for knowledge base search
          console.log('Function call requested:', parsedMessage);
          if (parsedMessage.name === 'search_knowledge_base') {
            try {
              const args = JSON.parse(parsedMessage.arguments);
              console.log('Searching knowledge base with query:', args.query);
              
              // Search the knowledge base using AIService
              const searchResults = await aiService.searchBusinessData(session.companyId, args.query);
              
              // Format the results for voice response
              let responseText = '';
              const analysis = searchResults.analysis;
              
              if (analysis.summary) {
                responseText = analysis.summary + '\n\n';
              }
              
              // Add relevant results
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
              
              // Send function output back to OpenAI
              const functionOutput = {
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: parsedMessage.call_id,
                  output: responseText
                }
              };
              
              console.log('Sending function output to OpenAI:', functionOutput);
              openaiWs.send(JSON.stringify(functionOutput));
              
              // Trigger response generation
              openaiWs.send(JSON.stringify({ type: 'response.create' }));
              
            } catch (error) {
              console.error('Error executing knowledge base search:', error);
              // Send error output
              openaiWs.send(JSON.stringify({
                type: 'conversation.item.create',
                item: {
                  type: 'function_call_output',
                  call_id: parsedMessage.call_id,
                  output: 'I encountered an error searching the knowledge base. Please try again.'
                }
              }));
              openaiWs.send(JSON.stringify({ type: 'response.create' }));
            }
          }
        } else if (parsedMessage.type === 'response.audio.delta') {
          // Forward audio chunks
          session.clientWs.send(JSON.stringify({
            type: 'audio',
            audio: parsedMessage.delta,
            itemId: parsedMessage.item_id
          }));
        } else if (parsedMessage.type === 'response.audio_transcript.delta') {
          // Forward transcript updates - these are from the assistant
          session.clientWs.send(JSON.stringify({
            type: 'transcript_delta',
            text: parsedMessage.delta,
            role: 'assistant' // Mark as assistant response
          }));
        } else if (parsedMessage.type === 'error') {
          console.error('OpenAI error:', parsedMessage.error);
          session.clientWs.send(JSON.stringify({
            type: 'error',
            error: parsedMessage.error?.message || 'OpenAI API error'
          }));
        } else {
          // Forward other message types as-is
          session.clientWs.send(message);
        }
      } catch (error) {
        console.error('Error processing OpenAI message:', error);
      }
    });

    openaiWs.on('error', (error) => {
      console.error('OpenAI WebSocket error:', error);
      session.clientWs.send(JSON.stringify({
        type: 'error',
        error: 'Connection to voice service failed'
      }));
    });

    openaiWs.on('close', (code, reason) => {
      console.log(`OpenAI connection closed, code: ${code}, reason: ${reason}`);
      if (session.clientWs.readyState === WebSocket.OPEN) {
        session.clientWs.send(JSON.stringify({
          type: 'connection',
          status: 'disconnected'
        }));
      }
    });

  } catch (error) {
    console.error('Failed to connect to OpenAI:', error);
    session.clientWs.send(JSON.stringify({
      type: 'error',
      error: 'Failed to establish voice connection'
    }));
  }
}

export function getActiveSessions(): number {
  return activeSessions.size;
}