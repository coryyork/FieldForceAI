import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import HeaderQuickActions from "./header-quick-actions";
import type { Company } from "@shared/schema";

export default function Header() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
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
    <header className="app-header px-4 sm:px-6 py-4 safe-area-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden p-3 rounded-xl touch-target">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <Sidebar mobile={true} />
            </SheetContent>
          </Sheet>

          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
              My {company?.name || "Organization"}
            </h1>
            <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
              Welcome back, <span className="font-medium">{user?.firstName || "User"}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Mobile search button */}
          <Button 
            variant="ghost" 
            size="sm" 
            className="lg:hidden p-2"
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <HeaderQuickActions />
            <Button variant="ghost" size="sm" className="p-3 rounded-xl touch-target">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
            <Button variant="ghost" size="sm" className="p-3 rounded-xl touch-target hidden sm:flex">
              <HelpCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Placeholder for future implementation */}
      {isMobileSearchOpen && (
        <div className="mt-4 lg:hidden">
          <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-center text-gray-600 dark:text-gray-400">
            Use the AI assistant button in the bottom right corner
          </div>
        </div>
      )}
    </header>
  );
}
