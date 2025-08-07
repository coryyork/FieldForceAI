import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, MessageCircle, X, User, Loader2, Mic } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import AISearchBar from "./ai-search-bar";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVoiceConnected, setIsVoiceConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Voice connection refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Get AI settings for voice configuration
  const { data: aiSettings } = useQuery<{
    voiceEnabled?: boolean;
    voiceId?: string;
    personalityKeywords?: string;
  }>({
    queryKey: ["/api/ai-settings"],
    retry: false,
  });

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/ai/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    },
    onSuccess: (data, query) => {
      // Add user message
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: query,
        timestamp: new Date()
      };

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: formatSearchResults(data),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, userMessage, assistantMessage]);
    },
    onError: (error) => {
      console.error('AI search error:', error);
      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  });

  const formatSearchResults = (data: any) => {
    const { analysis } = data;
    let response = analysis.summary;

    if (analysis.relevantResults?.documents?.length > 0) {
      response += "\n\n📄 Documents:\n";
      analysis.relevantResults.documents.forEach((doc: any) => {
        const fileTypeDisplay = doc.fileType === 'application/pdf' ? 'PDF' : 
                               doc.fileType === 'text/plain' ? 'Text' : 
                               doc.fileType || 'Document';
        response += `• ${doc.title} (${fileTypeDisplay})\n`;
      });
    }

    if (analysis.relevantResults?.leads?.length > 0) {
      response += "\n\n👥 Leads:\n";
      analysis.relevantResults.leads.forEach((lead: any) => {
        const location = lead.city && lead.state ? ` (${lead.city}, ${lead.state})` : 
                        lead.location ? ` (${lead.location})` : '';
        response += `• ${lead.name} at ${lead.company}${location} - Stage: ${lead.stage}\n`;
      });
    }

    if (analysis.relevantResults?.tasks?.length > 0) {
      response += "\n\n✅ Tasks:\n";
      analysis.relevantResults.tasks.forEach((task: any) => {
        const priorityIcon = task.priority === 'high' ? '🔴' : 
                           task.priority === 'medium' ? '🟡' : '🟢';
        response += `• ${task.title} - ${task.status} ${priorityIcon}\n`;
      });
    }

    if (analysis.suggestedActions?.length > 0) {
      response += "\n\n💡 Suggestions:\n";
      analysis.suggestedActions.slice(0, 3).forEach((action: string) => {
        response += `• ${action}\n`;
      });
    }

    return response;
  };

  const handleSearch = (query: string) => {
    console.log("AI search:", query);
    searchMutation.mutate(query);
  };

  const handleChat = (message: string) => {
    console.log("AI chat:", message);
    // For now, treat chat the same as search
    handleSearch(message);
  };

  const openAIAssistant = () => {
    setLocation("/ai-assistant");
  };

  const clearChat = () => {
    setMessages([]);
  };

  // Voice connection functions
  const connectVoice = async () => {
    if (isVoiceConnected) return;

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      mediaStreamRef.current = stream;

      // Initialize audio context
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      // Connect to WebSocket
      const ws = new WebSocket(`wss://${window.location.host}/api/voice/connect`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsVoiceConnected(true);
        
        // Send session configuration
        ws.send(JSON.stringify({
          type: "session.update",
          session: {
            voice: aiSettings?.voiceId || "alloy",
            instructions: aiSettings?.personalityKeywords ? (() => {
              try {
                const keywords = JSON.parse(aiSettings.personalityKeywords);
                return `You are a helpful AI assistant for Field Force 2. Your personality traits: ${keywords.join(", ")}`;
              } catch {
                return "You are a helpful AI assistant for Field Force 2.";
              }
            })() : "You are a helpful AI assistant for Field Force 2.",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
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

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "audio") {
          playAudioChunk(data.audio);
        } else if (data.type === "transcript" || data.type === "transcript_delta") {
          console.log("AI:", data.text);
        }
      };

      ws.onerror = () => {
        toast({
          title: "Voice Connection Failed",
          description: "Could not connect to voice service",
          variant: "destructive",
        });
      };

      ws.onclose = () => {
        setIsVoiceConnected(false);
      };

      // Process audio
      processorRef.current.onaudioprocess = (e) => {
        if (!isMuted && isVoiceConnected && ws.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Check for audio content
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

            ws.send(JSON.stringify({
              type: "input_audio_buffer.append",
              audio: btoa(binaryString)
            }));
          }
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

    } catch (error) {
      console.error("Voice connection failed:", error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice chat",
        variant: "destructive",
      });
    }
  };

  const disconnectVoice = () => {
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsVoiceConnected(false);
  };

  const toggleVoice = async () => {
    if (!isVoiceEnabled) {
      setIsVoiceEnabled(true);
      await connectVoice();
    } else {
      setIsVoiceEnabled(false);
      disconnectVoice();
    }
  };

  // Audio utility functions
  const convertFloat32ToPCM16 = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!audioContextRef.current) return;

    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

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

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-electric-blue hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 touch-target"
          size="icon"
        >
          <Bot className="w-6 h-6" />
        </Button>
      </div>

      {/* AI Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent 
          className="sm:max-w-[420px] h-[580px] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-700 z-50 rounded-xl"
          style={{
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            top: 'auto',
            left: 'auto',
            transform: 'none',
            margin: '0',
            zIndex: 9999
          }}
        >
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="flex items-center justify-between text-base font-semibold">
              <div className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-electric-blue" />
                AI Assistant
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVoice}
                  className={`h-8 w-8 p-0 transition-colors ${
                    isVoiceEnabled 
                      ? "text-electric-blue bg-electric-blue/10" 
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  title={isVoiceEnabled ? "Disable voice chat" : "Enable voice chat"}
                >
                  <Mic className="w-4 h-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 px-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
            {/* Chat Messages */}
            {messages.length > 0 ? (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user' 
                            ? 'bg-electric-blue text-white' 
                            : 'bg-gray-100 dark:bg-gray-800'
                        }`}>
                          {message.type === 'user' ? (
                            <User className="w-4 h-4" />
                          ) : (
                            <Bot className="w-4 h-4 text-electric-blue" />
                          )}
                        </div>
                        <div className={`rounded-2xl p-3 shadow-sm ${
                          message.type === 'user'
                            ? 'bg-electric-blue text-white'
                            : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                        }`}>
                          <div className="text-sm whitespace-pre-line leading-relaxed">
                            {message.content}
                          </div>
                          <div className={`text-xs mt-2 opacity-60 ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {searchMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="flex items-start gap-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <Bot className="w-4 h-4 text-electric-blue" />
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-3 shadow-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-electric-blue" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Analyzing your data...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 px-4">
                <div className="w-16 h-16 bg-electric-blue/10 rounded-full flex items-center justify-center">
                  <Bot className="w-8 h-8 text-electric-blue" />
                </div>
                <div>
                  <h3 className="font-medium text-lg text-gray-900 dark:text-gray-100">AI Assistant</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    Ask me about your business data, leads, tasks, or anything else!
                  </p>
                </div>
                
                {/* Quick Actions */}
                <div className="space-y-2 w-full">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Quick actions:</p>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={() => handleSearch("Show me my recent leads")}
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      Show me my recent leads
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSearch("What tasks are due today?")}
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      What tasks are due today?
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSearch("Summarize recent activities")}
                      className="w-full justify-start text-sm"
                      size="sm"
                    >
                      Summarize recent activities
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Voice Status */}
            {isVoiceEnabled && (
              <div className="text-xs text-center py-2 px-4 bg-electric-blue/5 rounded-lg border border-electric-blue/20">
                <div className="flex items-center justify-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${isVoiceConnected ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-electric-blue font-medium">
                    {isVoiceConnected ? 'Voice Active - Speak naturally' : 'Connecting voice...'}
                  </span>
                  {isVoiceConnected && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMuted(!isMuted)}
                      className="h-6 w-6 p-0"
                    >
                      {isMuted ? '🔇' : '🎤'}
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-4">
              <AISearchBar 
                onSearch={handleSearch} 
                onChat={handleChat}
                placeholder={isVoiceEnabled ? "Type or speak your question..." : "Ask AI about your business data..."}
                compact
                isLoading={searchMutation.isPending}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>


    </>
  );
}