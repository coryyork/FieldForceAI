import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import LeadForm from "@/components/crm/lead-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Users, DollarSign, TrendingUp, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useLocation } from "wouter";

export default function CRM() {
  const { toast } = useToast();
  const { user, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "Please login to continue",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/auth");
      }, 500);
      return;
    }
  }, [user, isLoading, toast, setLocation]);

  const { data: leads = [], isLoading: leadsLoading } = useQuery<any[]>({
    queryKey: ["/api/leads"],
    enabled: !!user,
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async (leadId: string) => {
      await apiRequest(`/api/leads/${leadId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
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
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case "new":
        return "bg-gray-100 text-gray-800";
      case "qualified":
        return "bg-blue-100 text-blue-800";
      case "proposal":
        return "bg-yellow-100 text-yellow-800";
      case "negotiation":
        return "bg-orange-100 text-orange-800";
      case "closed_won":
        return "bg-green-100 text-green-800";
      case "closed_lost":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatStage = (stage: string) => {
    return stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
  };

  // Calculate statistics
  const totalLeads = leads.length;
  const totalValue = leads.reduce((sum: number, lead: any) => sum + (parseFloat(lead.value) || 0), 0);
  const wonLeads = leads.filter((lead: any) => lead.stage === "closed_won").length;
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : "0";

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto app-container py-4 sm:py-6 space-y-4 sm:space-y-6 safe-area-bottom">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Sales</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your sales pipeline and track lead progress
              </p>
            </div>
            
            <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
              <DialogTrigger asChild>
                <Button className="app-button app-button-primary touch-target">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Lead
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Lead</DialogTitle>
                </DialogHeader>
                <LeadForm onSuccess={() => setIsNewLeadOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="app-card app-card-interactive">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Leads</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{totalLeads}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card app-card-interactive">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pipeline Value</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">${totalValue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="app-card app-card-interactive">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Conversion Rate</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leads Table */}
          <div className="app-card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Leads</h3>
            </div>
            <div className="p-6">
              {leadsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4 p-4 border rounded-lg">
                      <div className="rounded-full bg-gray-200 h-10 w-10"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : leads && leads.length > 0 ? (
                <div className="space-y-4">
                  {leads.map((lead: any) => (
                    <div 
                      key={lead.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div 
                        className="flex items-center space-x-4 cursor-pointer flex-1 app-card-interactive p-2 -m-2 rounded-xl"
                        onClick={() => {
                          console.log("Lead name area clicked:", lead.id);
                          setLocation(`/sales/lead/${lead.id}`);
                        }}
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold touch-target">
                          {lead.name?.charAt(0) || "?"}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">{lead.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {lead.company} • {lead.email}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${parseFloat(lead.value || 0).toLocaleString()}
                          </p>
                          <Badge className={getStageColor(lead.stage)}>
                            {formatStage(lead.stage)}
                          </Badge>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setLocation(`/sales/lead/${lead.id}`)}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteLeadMutation.mutate(lead.id);
                              }}
                            >
                              Delete Lead
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No leads yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Get started by adding your first lead to the CRM system.
                  </p>
                  <Button onClick={() => setIsNewLeadOpen(true)} className="app-button app-button-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Lead
                  </Button>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      
      {/* AI Floating Action Button */}
      <AIFab />
    </div>
  );
}
