import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Brain, Search, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface AISearchBarProps {
  onSearch: (query: string) => void;
  onChat?: (message: string) => void;
  placeholder?: string;
  compact?: boolean;
  isLoading?: boolean;
}

export default function AISearchBar({ 
  onSearch, 
  onChat, 
  placeholder = "Ask AI about your business data...",
  compact = false,
  isLoading = false
}: AISearchBarProps) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<'search' | 'chat'>('search');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (mode === 'search') {
      onSearch(query);
    } else if (onChat) {
      onChat(query);
    }
    
    setQuery("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className={cn("relative", compact ? "w-80" : "w-full max-w-2xl")}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20">
          <div className="p-3">
            <Brain className="w-5 h-5 text-blue-500" />
          </div>
          
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1"
            disabled={isLoading}
          />
          
          {!compact && (
            <div className="flex items-center space-x-2 px-3">
              <Button
                type="button"
                variant={mode === 'search' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setMode('search')}
                className="text-xs"
              >
                <Search className="w-3 h-3 mr-1" />
                Search
              </Button>
              {onChat && (
                <Button
                  type="button"
                  variant={mode === 'chat' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('chat')}
                  className="text-xs"
                >
                  <Send className="w-3 h-3 mr-1" />
                  Chat
                </Button>
              )}
            </div>
          )}
          
          <div className="p-2">
            <Button 
              type="submit" 
              size="sm" 
              disabled={!query.trim() || isLoading}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              {mode === 'search' ? <Search className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </form>
      
      {!compact && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 pointer-events-none">
          <kbd className="bg-white dark:bg-gray-700 px-2 py-1 rounded border text-xs">⌘K</kbd>
        </div>
      )}
    </div>
  );
}
