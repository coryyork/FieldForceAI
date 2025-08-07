import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Bot, MessageCircle, X } from "lucide-react";
import AISearchBar from "./ai-search-bar";

export default function AIFab() {
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const handleSearch = (query: string) => {
    console.log("AI search:", query);
    // Close the dialog and navigate to AI assistant with query
    setIsOpen(false);
    setLocation(`/ai-assistant?q=${encodeURIComponent(query)}`);
  };

  const handleChat = (message: string) => {
    console.log("AI chat:", message);
    // Close the dialog and navigate to AI assistant with message
    setIsOpen(false);
    setLocation(`/ai-assistant?chat=${encodeURIComponent(message)}`);
  };

  const openAIAssistant = () => {
    setLocation("/ai-assistant");
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Bot className="w-5 h-5 mr-2 text-electric-blue" />
                AI Assistant
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Quick Search */}
            <div>
              <AISearchBar 
                onSearch={handleSearch} 
                onChat={handleChat}
                placeholder="Ask AI about your business data..."
              />
            </div>
            
            {/* Quick Actions */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Quick actions:</p>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={openAIAssistant}
                  className="w-full justify-start"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Open Full AI Assistant
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSearch("Show me my top leads")}
                  className="w-full justify-start"
                >
                  Show me my top leads
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSearch("What tasks are due today?")}
                  className="w-full justify-start"
                >
                  What tasks are due today?
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleSearch("Summarize recent activities")}
                  className="w-full justify-start"
                >
                  Summarize recent activities
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}