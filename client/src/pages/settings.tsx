import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Brain, User, Shield, Bell } from "lucide-react";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import { useAuth } from "@/hooks/useAuth";

const settingsCategories = [
  {
    title: "AI Assistant",
    description: "Configure your AI assistant's personality, voice, and behavior",
    icon: Brain,
    href: "/ai-settings",
    color: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  },
  {
    title: "Account",
    description: "Manage your personal account settings and profile",
    icon: User,
    href: "/account-settings",
    color: "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
    disabled: true,
  },
  {
    title: "Security",
    description: "Password, authentication, and security preferences",
    icon: Shield,
    href: "/security-settings",
    color: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    disabled: true,
  },
  {
    title: "Notifications",
    description: "Email notifications and alert preferences",
    icon: Bell,
    href: "/notification-settings",
    color: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
    disabled: true,
  },
];

export default function Settings() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage your account and application preferences
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {settingsCategories.map((category) => {
                const IconComponent = category.icon;
                
                return (
                  <Card 
                    key={category.title} 
                    className={`hover:shadow-md transition-shadow ${category.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}>
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{category.title}</CardTitle>
                            <CardDescription className="text-sm">
                              {category.description}
                            </CardDescription>
                          </div>
                        </div>
                        {category.disabled && (
                          <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                            Coming Soon
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {category.disabled ? (
                        <Button variant="outline" disabled className="w-full">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      ) : (
                        <Link href={category.href}>
                          <Button variant="outline" className="w-full">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </main>
      </div>
      <AIFab />
    </div>
  );
}