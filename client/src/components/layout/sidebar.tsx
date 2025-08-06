import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  Zap, 
  LayoutDashboard, 
  Users, 
  Brain, 
  BookOpen, 
  BarChart3, 
  CheckSquare, 
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Sales",
    href: "/sales",
    icon: Users,
  },
  {
    name: "AI Assistant",
    href: "/ai-assistant",
    icon: Brain,
  },
  {
    name: "Knowledge Base",
    href: "/knowledge-base",
    icon: BookOpen,
  },
  {
    name: "Tasks & Notes",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="hidden md:flex w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-col safe-area-top">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 bg-electric-blue rounded-lg flex items-center justify-center electric-blue-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-xl font-bold text-gray-900 dark:text-white tracking-wide">
            FIELD FORCE
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = location === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "app-nav-item touch-target",
                  isActive ? "app-nav-item-active" : "app-nav-item-inactive"
                )}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-3">
          <Avatar className="w-10 h-10">
            <AvatarImage 
              src={user?.profileImageUrl || undefined} 
              alt={`${user?.firstName || ''} ${user?.lastName || ''}`}
              className="object-cover"
            />
            <AvatarFallback>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleLogout}
          variant="outline" 
          size="sm" 
          className="w-full justify-start app-button app-button-secondary touch-target"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
