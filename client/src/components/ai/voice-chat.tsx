import { useState, useRef, useEffect } from "react";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface VoiceChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VoiceChat({ isOpen, onClose }: VoiceChatProps) {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      // Initialize audio context for processing
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      
      // Resume audio context if suspended
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create a processor for handling audio chunks
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      // Connect to backend WebSocket endpoint
      const ws = new WebSocket(`wss://${window.location.host}/api/voice/connect`);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Voice connection established");
        setConnectionStatus("connected");
        setIsConnected(true);
        setIsListening(true);

        // Send initial configuration with voice settings
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
              silence_duration_ms: 800
            },
            modalities: ["text", "audio"]
          }
        }));
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
          } else if (data.type === "transcript_delta") {
            // Handle partial transcriptions
            console.log("Transcript delta:", data.text);
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

      ws.onclose = () => {
        console.log("Voice connection closed");
        setConnectionStatus("disconnected");
        setIsConnected(false);
        setIsListening(false);
      };

      // Process and send audio chunks
      processorRef.current.onaudioprocess = (e) => {
        if (!isMuted && isListening && ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Check if there's actual audio content
          let hasAudio = false;
          for (let i = 0; i < inputData.length; i++) {
            if (Math.abs(inputData[i]) > 0.01) {
              hasAudio = true;
              break;
            }
          }
          
          if (hasAudio) {
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
            } catch (error) {
              console.error("Error sending audio:", error);
            }
          }
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error("Failed to connect to voice API:", error);
      setConnectionStatus("disconnected");
      toast({
        title: "Connection Failed",
        description: "Could not establish voice connection. Please check your microphone permissions.",
        variant: "destructive",
      });
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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      disconnectVoice();
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">Voice Assistant</h2>
          <p className="text-gray-600 dark:text-gray-400">
            {connectionStatus === "connecting" && "Connecting to voice service..."}
            {connectionStatus === "connected" && `Speaking with ${aiSettings?.aiName || "AI Assistant"}`}
            {connectionStatus === "disconnected" && "Click connect to start voice chat"}
          </p>
        </div>

        {/* Voice Visualizer */}
        <div className="flex justify-center">
          <div className={`relative w-32 h-32 rounded-full flex items-center justify-center ${
            isConnected ? "bg-electric-blue/20" : "bg-gray-200 dark:bg-gray-700"
          }`}>
            {connectionStatus === "connecting" ? (
              <Loader2 className="w-12 h-12 animate-spin text-electric-blue" />
            ) : isListening ? (
              <div className="relative">
                <Mic className={`w-12 h-12 ${isMuted ? "text-gray-400" : "text-electric-blue"}`} />
                {!isMuted && (
                  <div className="absolute inset-0 animate-pulse">
                    <div className="w-full h-full rounded-full border-4 border-electric-blue/50"></div>
                  </div>
                )}
              </div>
            ) : (
              <MicOff className="w-12 h-12 text-gray-400" />
            )}
          </div>
        </div>

        {/* Voice Info */}
        {isConnected && aiSettings?.voiceId && (
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center justify-center space-x-2">
              <Volume2 className="w-4 h-4" />
              <span>Voice: {aiSettings.voiceId.charAt(0).toUpperCase() + aiSettings.voiceId.slice(1)}</span>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isConnected ? (
            <Button
              onClick={connectToVoiceAPI}
              disabled={connectionStatus === "connecting"}
              className="bg-electric-blue hover:bg-blue-600 text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              {connectionStatus === "connecting" ? "Connecting..." : "Connect"}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setIsMuted(!isMuted)}
                variant={isMuted ? "destructive" : "outline"}
              >
                {isMuted ? (
                  <>
                    <MicOff className="w-4 h-4 mr-2" />
                    Unmute
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 mr-2" />
                    Mute
                  </>
                )}
              </Button>
              <Button
                onClick={disconnectVoice}
                variant="destructive"
              >
                <PhoneOff className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </>
          )}
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          {!isConnected && "Voice conversations require microphone access"}
          {isConnected && !isMuted && "Speak clearly - the AI will respond when you pause"}
          {isConnected && isMuted && "Your microphone is muted"}
        </div>
        
        {/* Debug Info */}
        {isConnected && (
          <div className="text-xs text-center text-gray-400">
            Connection: {connectionStatus} | Audio Context: {audioContextRef.current?.state}
          </div>
        )}
      </Card>
    </div>
  );
}