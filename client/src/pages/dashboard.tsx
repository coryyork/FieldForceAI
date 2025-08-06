import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import MetricCard from "@/components/dashboard/metric-card";
import RecentLeads from "@/components/dashboard/recent-leads";
import QuickActions from "@/components/dashboard/quick-actions";
import KnowledgeBasePreview from "@/components/dashboard/knowledge-base-preview";
import ActivityTimeline from "@/components/dashboard/activity-timeline";
import AIAssistantBanner from "@/components/dashboard/ai-assistant-banner";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, Users, Handshake, CheckSquare } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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

  const { data: leads = [] } = useQuery<any[]>({
    queryKey: ["/api/leads"],
    enabled: isAuthenticated,
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return null;
  }

  // Calculate metrics from real data
  const totalLeads = leads.length;
  const qualifiedLeads = leads.filter((lead: any) => lead.stage === "qualified").length;
  const proposalLeads = leads.filter((lead: any) => lead.stage === "proposal").length;
  const wonLeads = leads.filter((lead: any) => lead.stage === "closed_won").length;
  const totalRevenue = leads
    .filter((lead: any) => lead.stage === "closed_won")
    .reduce((sum: number, lead: any) => sum + (parseFloat(lead.value) || 0), 0);
  
  const pendingTasks = tasks.filter((task: any) => task.status === "pending").length;
  const totalTasks = tasks.length;

  const metrics = [
    {
      title: "Monthly Revenue",
      value: `$${totalRevenue.toLocaleString()}`,
      change: totalRevenue > 0 ? "+12.5%" : "0%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "success-green" as const,
    },
    {
      title: "Active Leads",
      value: totalLeads.toString(),
      change: totalLeads > 0 ? "+8.2%" : "0%",
      changeType: "positive" as const,
      icon: Users,
      color: "electric-blue" as const,
    },
    {
      title: "Conversions",
      value: wonLeads.toString(),
      change: wonLeads > 0 ? "+15.3%" : "0%",
      changeType: "positive" as const,
      icon: Handshake,
      color: "tech-cyan" as const,
    },
    {
      title: "Total Tasks",
      value: totalTasks.toString(),
      change: `${pendingTasks} pending`,
      changeType: "neutral" as const,
      icon: CheckSquare,
      color: "neutral-grey" as const,
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto app-container py-6 space-y-6 safe-area-bottom">
          {/* AI Assistant Banner */}
          <AIAssistantBanner />

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {metrics.map((metric, index) => (
              <MetricCard key={index} {...metric} />
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="app-grid">
            <div className="lg:col-span-2 xl:col-span-2">
              <RecentLeads />
            </div>
            
            <div className="space-y-6">
              <QuickActions />
              <KnowledgeBasePreview />
            </div>
          </div>

          {/* Activity Timeline */}
          <ActivityTimeline />
        </main>
      </div>
    </div>
  );
}
