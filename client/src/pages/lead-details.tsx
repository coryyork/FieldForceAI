import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LeadForm from "@/components/crm/lead-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, User, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useLocation, useRoute } from "wouter";

export default function LeadDetails() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [match, params] = useRoute("/sales/lead/:id");

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

  const { data: lead, isLoading: leadLoading, error } = useQuery<any>({
    queryKey: ["/api/leads", params?.id],
    queryFn: () => apiRequest(`/api/leads/${params?.id}`),
    enabled: isAuthenticated && !!params?.id,
  });



  const deleteLeadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/leads/${params?.id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: "Lead deleted successfully",
      });
      setLocation("/sales");
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

  const formatStage = (stage: string) => {
    return stage?.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || 'Unknown';
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'qualified': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'proposal': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'negotiation': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'closed_won': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'closed_lost': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (leadLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-auto p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Lead not found</h2>
              <Button onClick={() => setLocation("/sales")} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Sales
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setLocation("/sales")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Sales
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lead.name}</h1>
                  <p className="text-gray-600 dark:text-gray-400">{lead.company}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button onClick={() => setIsEditOpen(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  onClick={() => deleteLeadMutation.mutate()} 
                  variant="destructive"
                  disabled={deleteLeadMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Lead Information */}
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                        <p className="text-gray-900 dark:text-white">{lead.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Title</label>
                        <p className="text-gray-900 dark:text-white">{lead.title || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                        <p className="text-gray-900 dark:text-white flex items-center">
                          {lead.email ? (
                            <>
                              <Mail className="w-4 h-4 mr-2" />
                              <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                                {lead.email}
                              </a>
                            </>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</label>
                        <p className="text-gray-900 dark:text-white flex items-center">
                          {lead.phone ? (
                            <>
                              <Phone className="w-4 h-4 mr-2" />
                              <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                                {lead.phone}
                              </a>
                            </>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company</label>
                        <p className="text-gray-900 dark:text-white flex items-center">
                          {lead.company ? (
                            <>
                              <Building className="w-4 h-4 mr-2" />
                              {lead.company}
                            </>
                          ) : "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Source</label>
                        <p className="text-gray-900 dark:text-white">{lead.source || "N/A"}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Assigned To</label>
                        <p className="text-gray-900 dark:text-white">{lead.assignedUserId || "Unassigned"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {lead.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lead.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Deal Information */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Deal Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stage</label>
                      <div className="mt-1">
                        <Badge className={getStageColor(lead.stage)}>
                          {formatStage(lead.stage)}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Deal Value</label>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${parseFloat(lead.value || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Probability</label>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                        <span className="text-gray-900 dark:text-white">{lead.probability || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Expected Value</label>
                      <p className="text-lg font-semibold text-green-600">
                        ${((parseFloat(lead.value || 0) * (lead.probability || 0)) / 100).toLocaleString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                      <p className="text-gray-900 dark:text-white">
                        {new Date(lead.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Edit Lead Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <LeadForm
            onSuccess={() => {
              setIsEditOpen(false);
              queryClient.invalidateQueries({ queryKey: ["/api/leads", params?.id] });
            }}
            initialData={lead}
            leadId={params?.id}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}