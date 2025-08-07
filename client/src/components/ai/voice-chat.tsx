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
      
      console.log("Created ScriptProcessorNode, buffer size:", 4096);
      console.log("Audio context sample rate:", audioContextRef.current.sampleRate);
      
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
                    return `You are a helpful AI assistant for a business management platform called Field Force 2. Your personality traits: ${keywords.join(", ")}. Help users with their leads, tasks, documents, and business questions.`;
                  } catch {
                    return "You are a helpful AI assistant for a business management platform called Field Force 2. Help users with their leads, tasks, documents, and business questions.";
                  }
                })() : "You are a helpful AI assistant for a business management platform called Field Force 2. Help users with their leads, tasks, documents, and business questions.",
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                input_audio_transcription: { model: "whisper-1" },
                turn_detection: {
                  type: "server_vad",
                  threshold: 0.5,
                  prefix_padding_ms: 300,
                  silence_duration_ms: 1200
                },
                modalities: ["text", "audio"]
              }
            }));
            console.log("Session configuration sent");
            
            // Set up keep-alive ping
            const keepAlive = setInterval(() => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping' }));
                console.log("Sending keep-alive ping");
              } else {
                console.log("WebSocket not ready, clearing keep-alive");
                clearInterval(keepAlive);
              }
            }, 10000); // ping every 10 seconds
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
          } else if (data.type === "transcript") {
            // Handle transcription updates
            console.log("Transcript:", data.text);
            if (onTranscript && data.text) {
              onTranscript(data.text);
            }
          } else if (data.type === "transcript_delta") {
            // Handle partial transcriptions
            console.log("Transcript delta:", data.text);
            if (onTranscript && data.text) {
              onTranscript(data.text);
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

      let audioBuffer: Float32Array[] = [];
      let silenceCounter = 0;
      let processedFrameCount = 0;
      const maxSilenceFrames = 50; // ~1 second of silence before committing
      
      // Process and send audio chunks
      processorRef.current.onaudioprocess = (e) => {
        processedFrameCount++;
        
        // Log every 50 frames to see if processing is happening
        if (processedFrameCount % 50 === 1) {
          console.log(`Audio processing active! Frame count: ${processedFrameCount}, ws ready: ${ws.readyState === WebSocket.OPEN}, isListening: ${isListening}`);
        }
        
        // Remove muted check - we should always send audio to OpenAI for processing
        if (isListening && ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Check if there's actual audio content
          let hasAudio = false;
          let amplitude = 0;
          for (let i = 0; i < inputData.length; i++) {
            const sample = Math.abs(inputData[i]);
            amplitude = Math.max(amplitude, sample);
            if (sample > 0.005) { // Lower threshold to detect quieter audio
              hasAudio = true;
            }
          }
          
          // Always log first few audio detections
          if (hasAudio && Math.random() < 0.2) {
            console.log("Audio detected! Amplitude:", amplitude.toFixed(4));
          }
          
          if (hasAudio) {
            silenceCounter = 0;
            audioBuffer.push(new Float32Array(inputData));
            
            // Send audio chunk immediately
            const pcm16 = convertFloat32ToPCM16(inputData);
            const uint8Array = new Uint8Array(pcm16.buffer);
            let binaryString = '';
            for (let i = 0; i < uint8Array.length; i++) {
              binaryString += String.fromCharCode(uint8Array[i]);
            }
            
            try {
              ws.send(JSON.stringify({
                type: "input_audio_buffer.append",
                audio: btoa(binaryString)
              }));
              // Log audio sending occasionally to avoid spam
              if (Math.random() < 0.1) {
                console.log("Sending audio chunk, amplitude:", amplitude.toFixed(3), "size:", uint8Array.length);
              }
            } catch (error) {
              console.error("Error sending audio:", error);
            }
          } else {
            silenceCounter++;
            
            // If we have audio in buffer and silence detected, commit the audio
            if (audioBuffer.length > 0 && silenceCounter > maxSilenceFrames) {
              try {
                ws.send(JSON.stringify({
                  type: "input_audio_buffer.commit"
                }));
                console.log("Audio committed after silence detected");
              } catch (error) {
                console.error("Error committing audio:", error);
              }
              audioBuffer = [];
              silenceCounter = 0;
            }
          }
        }
      };

      // Connect the audio nodes
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      console.log("Audio processing connected successfully");
      console.log("Audio stream tracks:", stream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled, readyState: t.readyState })));
      
      // Test that the processor is working by logging immediately
      console.log("Processor connected. Waiting for onaudioprocess events...");
      
      // Force audio context to stay active
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.setValueAtTime(0, audioContextRef.current.currentTime); // Silent
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      oscillator.start();
      console.log("Started silent oscillator to keep audio context active");

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

  // Play received audio chunks
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
      source.start();
    } catch (error) {
      console.error("Error playing audio:", error);
    }
  };

  // Auto-connect when enabled
  useEffect(() => {
    console.log("Voice effect triggered - isEnabled:", isEnabled, "isConnected:", isConnected);
    
    if (isEnabled) {
      console.log("Auto-connecting to voice...");
      connectToVoiceAPI();
    } else {
      console.log("Auto-disconnecting voice...");
      disconnectVoice();
    }
    
    return () => {
      disconnectVoice();
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