import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface VoiceChatProps {
  isEnabled: boolean;
  onTranscript?: (text: string) => void;
  onConnectionChange?: (connected: boolean) => void;
  onMuteChange?: (muted: boolean) => void;
}

export default function VoiceChat({ 
  isEnabled, 
  onTranscript, 
  onConnectionChange,
  onMuteChange 
}: VoiceChatProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false); // Note: muted state is for UI only, audio always sent
  const [isListening, setIsListening] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"disconnected" | "connecting" | "connected">("disconnected");
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Get AI settings including voice preferences
  const { data: aiSettings } = useQuery<{
    aiName?: string;
    personalityKeywords?: string;
    voiceId?: string;
    voiceEnabled?: boolean;
    voiceSpeed?: number;
  }>({
    queryKey: ["/api/ai-settings"],
    retry: false,
  });

  // Initialize WebSocket connection to OpenAI Realtime API
  const connectToVoiceAPI = async () => {
    try {
      setConnectionStatus("connecting");

      console.log("Requesting microphone access...");
      
      // Request microphone permission first
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 24000
        } 
      });
      
      console.log("Microphone access granted!", stream.getTracks());
      mediaStreamRef.current = stream;

      // Initialize audio context for processing
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Resume audio context if suspended (required for many browsers)
      if (audioContextRef.current.state === 'suspended') {
        console.log("Resuming audio context...");
        await audioContextRef.current.resume();
      }
      
      console.log("Audio context state:", audioContextRef.current.state);
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create a processor for handling audio chunks
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      console.log("Connecting to WebSocket...");
      // Connect to backend WebSocket endpoint  
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${wsProtocol}//${window.location.host}/api/voice/connect`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Voice connection established");
        setConnectionStatus("connected");
        setIsConnected(true);
        setIsListening(true);

        // Wait a moment for connection to stabilize then send session update
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: "session.update",
              session: {
                voice: aiSettings?.voiceId || "alloy",
                instructions: aiSettings?.personalityKeywords ? (() => {
                  try {
                    const keywords = JSON.parse(aiSettings.personalityKeywords);
                    return `You are a helpful AI assistant for a business management platform called Field Force 2. Your personality traits: ${keywords.join(", ")}. Help users with their leads, tasks, documents, and business questions. Always respond in English regardless of the input language.`;
                  } catch {
                    return "You are a helpful AI assistant for a business management platform called Field Force 2. Help users with their leads, tasks, documents, and business questions. Always respond in English regardless of the input language.";
                  }
                })() : "You are a helpful AI assistant for a business management platform called Field Force 2. Help users with their leads, tasks, documents, and business questions. Always respond in English regardless of the input language.",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: { model: "whisper-1" },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 500,  // Balanced for natural conversation
                  create_response: true,
                  interrupt_response: true  // Allow interrupting AI when user starts speaking
                },
                modalities: ["text", "audio"]
              }
            }));
            console.log("Session configuration sent");
            
            // Set up keep-alive ping
            const keepAlive = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
              } else {
                clearInterval(keepAlive);
              }
            }, 30000); // ping every 30 seconds
          }
        }, 100);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("Received message type:", data.type);
          
          if (data.type === "audio") {
            // Play received audio
            await playAudioChunk(data.audio);
          } else if (data.type === "speech_started") {
            // User started speaking - immediately stop all playing audio
            console.log("User started speaking - stopping AI audio");
            stopAllAudio();
          } else if (data.type === "transcript") {
            // Only process user transcripts, not AI responses
            if (data.role === "user") {
              console.log("User transcript:", data.text);
              // Don't trigger search when voice is connected - OpenAI handles the full conversation
              // if (onTranscript && data.text) {
              //   onTranscript(data.text);
              // }
            }
          } else if (data.type === "transcript_delta") {
            // Skip AI response transcript deltas - only process user input
            if (data.role === "user") {
              console.log("User transcript delta:", data.text);
              // Don't trigger search when voice is connected - OpenAI handles the full conversation
              // if (onTranscript && data.text) {
              //   onTranscript(data.text);
              // }
            }
          } else if (data.type === "error") {
            console.error("Voice API error:", data.error);
            toast({
              title: "Voice Error",
              description: data.error,
              variant: "destructive",
            });
          } else if (data.type === "connection") {
            console.log("Connection status:", data.status);
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionStatus("disconnected");
        setIsConnected(false);
      };

      ws.onclose = (event) => {
        console.log(`Voice connection closed: code=${event.code}, reason=${event.reason}, wasClean=${event.wasClean}`);
        setConnectionStatus("disconnected");
        setIsConnected(false);
        setIsListening(false);
      };

      // Process and send audio chunks with minimal buffering for faster response
      processorRef.current.onaudioprocess = (e) => {
        // Only process if WebSocket is ready
        if (ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert and send immediately - no buffering for real-time response
          const pcm16 = convertFloat32ToPCM16(inputData);
          const uint8Array = new Uint8Array(pcm16.buffer);
          let binaryString = '';
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          
          // Send audio chunk directly to OpenAI for immediate processing
          ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: btoa(binaryString)
          }));
        }

      };

      // Connect the audio nodes
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      console.log("Audio processing connected");

    } catch (error) {
      console.error("Failed to connect to voice API:", error);
      setConnectionStatus("disconnected");
      toast({
        title: "Connection Failed", 
        description: "Could not establish voice connection. Please check your microphone permissions.",
        variant: "destructive",
      });
      
      // Clean up on error
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    }
  };

  // Disconnect from voice API
  const disconnectVoice = () => {
    console.log("Disconnecting voice...");
    
    // Stop all playing audio
    if (audioSourcesRef.current) {
      audioSourcesRef.current.forEach(source => {
        try {
          source.stop();
        } catch (e) {
          // Source may have already stopped
        }
      });
      audioSourcesRef.current.clear();
    }
    nextPlayTimeRef.current = 0;
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setConnectionStatus("disconnected");
  };

  // Convert audio format for transmission
  const convertFloat32ToPCM16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  // Track playing audio sources to prevent overlap
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextPlayTimeRef = useRef<number>(0);
  
  // Stop all playing audio immediately (for interruptions)
  const stopAllAudio = () => {
    console.log(`Stopping ${audioSourcesRef.current.size} audio sources`);
    audioSourcesRef.current.forEach(source => {
      try {
        source.stop();
      } catch (e) {
        // Source may have already stopped
      }
    });
    audioSourcesRef.current.clear();
    nextPlayTimeRef.current = 0;
  };
  
  // Play received audio chunks with queueing to prevent overlap
  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current) return;

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32 for playback
      const float32Array = new Float32Array(bytes.length / 2);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < float32Array.length; i++) {
        const int16 = dataView.getInt16(i * 2, true);
        float32Array[i] = int16 / (int16 < 0 ? 0x8000 : 0x7FFF);
      }

      const audioBuffer = audioContextRef.current.createBuffer(1, float32Array.length, 24000);
      audioBuffer.copyToChannel(float32Array, 0);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      // Schedule audio to play sequentially
      const currentTime = audioContextRef.current.currentTime;
      const playTime = Math.max(currentTime, nextPlayTimeRef.current);
      
      source.start(playTime);
      nextPlayTimeRef.current = playTime + audioBuffer.duration;
      
      // Track and clean up sources
      audioSourcesRef.current.add(source);
      source.onended = () => {
        audioSourcesRef.current.delete(source);
        // Reset timing if no more sources
        if (audioSourcesRef.current.size === 0) {
          nextPlayTimeRef.current = 0;
        }
      };
      
      console.log(`Audio scheduled at ${playTime.toFixed(3)}s, duration: ${audioBuffer.duration.toFixed(3)}s`);
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Auto-connect when enabled
  useEffect(() => {
    console.log("Voice effect triggered - isEnabled:", isEnabled, "isConnected:", isConnected);
    
    if (isEnabled && !isConnected) {
      console.log("Auto-connecting to voice...");
      connectToVoiceAPI();
    } else if (!isEnabled && isConnected) {
      console.log("Auto-disconnecting voice...");
      disconnectVoice();
    }
    
    return () => {
      if (isConnected) {
        disconnectVoice();
      }
    };
  }, [isEnabled]);
  
  // Notify parent of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(isConnected);
    }
  }, [isConnected, onConnectionChange]);
  
  // Notify parent of mute changes
  useEffect(() => {
    if (onMuteChange) {
      onMuteChange(isMuted);
    }
  }, [isMuted, onMuteChange]);

  // This is a headless component - no UI
  return null;
}