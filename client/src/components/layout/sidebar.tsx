import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { 
  Zap, 
  LayoutDashboard, 
  Users, 
  Brain, 
  BookOpen, 
  BarChart3, 
  CheckSquare, 
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2
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
    submenu: [
      {
        name: "Knowledge Base",
        href: "/knowledge-base",
        icon: BookOpen,
      },
      {
        name: "AI Settings",
        href: "/ai-settings",
        icon: Settings,
      },
    ],
  },
  {
    name: "Tasks & Notes",
    href: "/tasks",
    icon: CheckSquare,
  },
  {
    name: "Recruitment",
    href: "/recruitment",
    icon: Building2,
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

interface SidebarProps {
  mobile?: boolean;
}

export default function Sidebar({ mobile = false }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(["AI Assistant"]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const toggleMenu = (itemName: string) => {
    setExpandedMenus(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const baseClasses = "w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col safe-area-top";
  const responsiveClasses = mobile ? baseClasses : `hidden md:flex ${baseClasses}`;

  return (
    <div className={responsiveClasses}>
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
          const isActive = location === item.href || (item.submenu && item.submenu.some(sub => location === sub.href));
          const isExpanded = expandedMenus.includes(item.name);
          const Icon = item.icon;
          
          return (
            <div key={item.name}>
              {item.submenu ? (
                <>
                  <div
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "app-nav-item touch-target cursor-pointer",
                      isActive ? "app-nav-item-active" : "app-nav-item-inactive"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="flex-1">{item.name}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                  {isExpanded && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.submenu.map((subItem) => {
                        const subIsActive = location === subItem.href;
                        const SubIcon = subItem.icon;
                        
                        return (
                          <Link key={subItem.name} href={subItem.href}>
                            <div
                              className={cn(
                                "app-nav-item touch-target text-sm",
                                subIsActive ? "app-nav-item-active" : "app-nav-item-inactive"
                              )}
                            >
                              <SubIcon className="w-4 h-4" />
                              <span>{subItem.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href}>
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
              )}
            </div>
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
