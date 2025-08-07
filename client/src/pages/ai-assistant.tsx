import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import AISearchBar from "@/components/ai/ai-search-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Search, Lightbulb, Users, FileText, CheckSquare } from "lucide-react";

interface SearchResult {
  query: string;
  analysis: {
    summary: string;
    relevantResults: {
      leads: any[];
      documents: any[];
      tasks: any[];
    };
    suggestedActions: string[];
    totalResults: number;
  };
  rawResults: {
    leads: any[];
    documents: any[];
    tasks: any[];
  };
}

export default function AIAssistant() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', message: string}>>([]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest("/api/ai/search", {
        method: "POST",
        body: { query },
      });
    },
    onSuccess: (data) => {
      setSearchResults(data);
      setChatHistory(prev => [...prev, 
        { type: 'user', message: data.query },
        { type: 'ai', message: data.analysis.summary }
      ]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Search Failed",
        description: "Failed to perform AI search. Please try again.",
        variant: "destructive",
      });
    },
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("/api/ai/chat", {
        method: "POST",
        body: { message },
      });
    },
    onSuccess: (data, message) => {
      setChatHistory(prev => [...prev, 
        { type: 'user', message },
        { type: 'ai', message: data.response }
      ]);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Chat Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const handleSearch = (query: string) => {
    searchMutation.mutate(query);
  };

  const handleChat = (message: string) => {
    chatMutation.mutate(message);
  };

  const quickQueries = [
    "Show me hot leads from this month",
    "What are our top performing campaigns?",
    "Find documents about pricing strategy",
    "List all pending tasks",
    "Analyze our sales pipeline",
    "Show recent high-value deals"
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">AI Assistant</h1>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base px-4">
              Search across your CRM data, knowledge base, and business metrics with natural language. 
              Ask questions and get intelligent insights about your business.
            </p>
          </div>

          {/* AI Search Bar */}
          <div className="max-w-4xl mx-auto">
            <AISearchBar 
              onSearch={handleSearch} 
              onChat={handleChat}
              isLoading={searchMutation.isPending || chatMutation.isPending} 
            />
          </div>

          {/* Quick Query Suggestions */}
          {!searchResults && chatHistory.length === 0 && (
            <div className="max-w-4xl mx-auto">
              <Card className="app-card">
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Try These Queries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {quickQueries.map((query, index) => (
                      <Button 
                        key={index}
                        variant="outline" 
                        className="justify-start text-left h-auto p-3 sm:p-4 text-sm sm:text-base app-button touch-target"
                        onClick={() => handleSearch(query)}
                      >
                        <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{query}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chat History */}
          {chatHistory.length > 0 && (
            <div className="max-w-4xl mx-auto">
              <Card className="app-card">
                <CardHeader>
                  <CardTitle>Conversation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {chatHistory.map((message, index) => (
                      <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-sm p-3 rounded-lg text-sm ${
                          message.type === 'user' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                        }`}>
                          {message.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search Results */}
          {searchResults && (
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    {searchResults.analysis.summary}
                  </p>
                  
                  {searchResults.analysis.suggestedActions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Suggested Actions:</h4>
                      <div className="flex flex-wrap gap-2">
                        {searchResults.analysis.suggestedActions.map((action, index) => (
                          <Badge key={index} variant="secondary">{action}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Results Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Leads Results */}
                {searchResults.rawResults.leads.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Users className="w-5 h-5 mr-2" />
                        Leads ({searchResults.rawResults.leads.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.rawResults.leads.map((lead: any) => (
                          <div key={lead.id} className="p-3 border rounded-lg">
                            <h4 className="font-semibold text-sm">{lead.name}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{lead.company}</p>
                            <div className="flex justify-between items-center mt-2">
                              <Badge variant="outline">{lead.stage}</Badge>
                              <span className="text-sm font-medium">${parseFloat(lead.value || 0).toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Documents Results */}
                {searchResults.rawResults.documents.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="w-5 h-5 mr-2" />
                        Documents ({searchResults.rawResults.documents.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.rawResults.documents.map((doc: any) => (
                          <div key={doc.id} className="p-3 border rounded-lg">
                            <h4 className="font-semibold text-sm">{doc.title}</h4>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{doc.fileType}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Updated {new Date(doc.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tasks Results */}
                {searchResults.rawResults.tasks.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <CheckSquare className="w-5 h-5 mr-2" />
                        Tasks ({searchResults.rawResults.tasks.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.rawResults.tasks.map((task: any) => (
                          <div key={task.id} className="p-3 border rounded-lg">
                            <h4 className="font-semibold text-sm">{task.title}</h4>
                            <div className="flex justify-between items-center mt-2">
                              <Badge variant="outline">{task.status}</Badge>
                              <Badge variant="secondary">{task.priority}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
      
      {/* AI Floating Action Button */}
      <AIFab />
    </div>
  );
}
