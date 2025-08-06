import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import AISearchBar from "@/components/ai/ai-search-bar";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle } from "lucide-react";
import type { Company } from "@shared/schema";

export default function Header() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: company } = useQuery<Company | null>({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // This could trigger a global search or navigate to search results
    console.log("Global search:", query);
  };

  const handleChat = (message: string) => {
    // This could open a chat modal or navigate to the AI assistant
    console.log("AI chat:", message);
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My {company?.name || "Organization"}</h1>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Welcome back, <span className="font-medium">{user?.firstName || "User"}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* AI Search Bar */}
          <div className="hidden md:block">
            <AISearchBar 
              onSearch={handleSearch} 
              onChat={handleChat}
              placeholder="Ask AI about your business data..."
              compact
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="sm" className="p-2">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-2">
              <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
