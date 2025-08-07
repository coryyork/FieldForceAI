import WebSocket from 'ws';
import { IncomingMessage } from 'http';

// OpenAI Realtime API configuration
const OPENAI_REALTIME_URL = 'wss://api.openai.com/v1/realtime';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

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

  // Connect to OpenAI Realtime API
  connectToOpenAI(session);

  // Handle client messages
  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message);
      
      if (session.openaiWs && session.openaiWs.readyState === WebSocket.OPEN) {
        // Forward message to OpenAI
        session.openaiWs.send(JSON.stringify(data));
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
  ws.on('close', () => {
    console.log(`Voice session ended: ${sessionId}`);
    
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

function connectToOpenAI(session: VoiceSession) {
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
      
      // Notify client of successful connection
      session.clientWs.send(JSON.stringify({
        type: 'connection',
        status: 'connected'
      }));
    });

    openaiWs.on('message', (data: WebSocket.Data) => {
      try {
        // Forward OpenAI responses to client
        const message = data.toString();
        const parsedMessage = JSON.parse(message);
        
        // Handle different message types from OpenAI
        if (parsedMessage.type === 'session.created') {
          console.log('OpenAI session created:', parsedMessage.session);
        } else if (parsedMessage.type === 'conversation.item.created') {
          // Forward transcripts and responses
          session.clientWs.send(JSON.stringify({
            type: 'transcript',
            text: parsedMessage.item?.content?.[0]?.transcript || '',
            role: parsedMessage.item?.role
          }));
        } else if (parsedMessage.type === 'response.audio.delta') {
          // Forward audio chunks
          session.clientWs.send(JSON.stringify({
            type: 'audio',
            audio: parsedMessage.delta,
            itemId: parsedMessage.item_id
          }));
        } else if (parsedMessage.type === 'response.audio_transcript.delta') {
          // Forward transcript updates
          session.clientWs.send(JSON.stringify({
            type: 'transcript_delta',
            text: parsedMessage.delta
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

    openaiWs.on('close', () => {
      console.log('OpenAI connection closed');
      session.clientWs.send(JSON.stringify({
        type: 'connection',
        status: 'disconnected'
      }));
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