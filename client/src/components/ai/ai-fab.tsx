import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, MessageCircle, X, User, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import AISearchBar from "./ai-search-bar";

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setLocation] = useLocation();

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest(`/api/ai/search`, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: { 'Content-Type': 'application/json' }
      });
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
    }
  });

  const formatSearchResults = (data: any) => {
    const { analysis } = data;
    let response = `${analysis.summary}\n\n`;

    if (analysis.relevantResults?.leads?.length > 0) {
      response += "**Leads Found:**\n";
      analysis.relevantResults.leads.forEach((lead: any) => {
        response += `• ${lead.name} (${lead.company}) - ${lead.stage}\n`;
      });
      response += "\n";
    }

    if (analysis.suggestedActions?.length > 0) {
      response += "**Suggested Actions:**\n";
      analysis.suggestedActions.forEach((action: string) => {
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

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
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
        <DialogContent className="sm:max-w-lg h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-electric-blue" />
                AI Assistant
              </div>
              <div className="flex items-center space-x-2">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-6 w-6 p-0 text-gray-500"
                  >
                    Clear
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 flex flex-col space-y-4">
            {/* Chat Messages */}
            {messages.length > 0 ? (
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2`}>
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
                        <div className={`rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-electric-blue text-white ml-2'
                            : 'bg-gray-100 dark:bg-gray-800 mr-2'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                          <div className={`text-xs mt-1 opacity-70 ${
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
                      <div className="flex items-start space-x-2">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                          <Bot className="w-4 h-4 text-electric-blue" />
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="w-4 h-4 animate-spin text-electric-blue" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <Bot className="w-12 h-12 text-electric-blue" />
                <div>
                  <h3 className="font-medium text-lg">AI Assistant</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
            
            {/* Search Input */}
            <div className="border-t pt-4">
              <AISearchBar 
                onSearch={handleSearch} 
                onChat={handleChat}
                placeholder="Ask AI about your business data..."
                compact
                isLoading={searchMutation.isPending}
              />
              <div className="mt-2 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={openAIAssistant}
                  className="text-xs text-gray-500"
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Open Full Assistant
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}