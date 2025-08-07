import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import LeadTasks from "@/components/leads/lead-tasks";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import LeadForm from "@/components/crm/lead-form";
import NotesTimeline from "@/components/crm/notes-timeline";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, Edit, Trash2, Mail, Phone, Building, User, DollarSign, TrendingUp, Calendar, MapPin } from "lucide-react";
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
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setLocation("/sales")}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{lead.name}</h1>
                    <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                      <span className="flex items-center">
                        <Building className="w-4 h-4 mr-1" />
                        {lead.company || "No Company"}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`${
                          lead.stage === 'closed_won' 
                            ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-900/20'
                            : lead.stage === 'closed_lost'
                            ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-900/20'
                            : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-900/20'
                        }`}
                      >
                        {lead.stage.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                      {lead.value && (
                        <span className="flex items-center font-semibold text-green-600">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${parseFloat(lead.value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button 
                    onClick={() => setIsEditOpen(true)} 
                    variant="outline"
                    className="border-gray-300 hover:border-gray-400"
                  >
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
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content Area - Contact Info and Notes Timeline */}
              <div className="lg:col-span-3 space-y-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                {/* Lead Notes */}
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

                {/* Notes Timeline */}
                <NotesTimeline leadId={lead.id} />
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1 space-y-6">
                {/* Lead Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Lead Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Stage</label>
                      <Badge 
                        variant="outline" 
                        className={`block mt-1 w-fit ${
                          lead.stage === 'closed_won' 
                            ? 'border-green-200 text-green-700 bg-green-50 dark:border-green-800 dark:text-green-300 dark:bg-green-900/20'
                            : lead.stage === 'closed_lost'
                            ? 'border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-300 dark:bg-red-900/20'
                            : 'border-blue-200 text-blue-700 bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:bg-blue-900/20'
                        }`}
                      >
                        {lead.stage.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </Badge>
                    </div>
                    {lead.value && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Value</label>
                        <p className="text-lg font-semibold text-green-600 mt-1">
                          ${parseFloat(lead.value).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {lead.probability !== null && (
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Probability</label>
                        <p className="text-gray-900 dark:text-white mt-1">{lead.probability || 0}%</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button 
                      onClick={() => window.open(`mailto:${lead.email}`)} 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={!lead.email}
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Send Email
                    </Button>
                    <Button 
                      onClick={() => window.open(`tel:${lead.phone}`)} 
                      variant="outline" 
                      className="w-full justify-start"
                      disabled={!lead.phone}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call Lead
                    </Button>
                  </CardContent>
                </Card>

                {/* Address Information */}
                {(lead.street || lead.city || lead.state || lead.zipCode || lead.country) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {lead.street && (
                          <p className="text-gray-900 dark:text-white">{lead.street}</p>
                        )}
                        <p className="text-gray-900 dark:text-white">
                          {[lead.city, lead.state, lead.zipCode].filter(Boolean).join(", ")}
                        </p>
                        {lead.country && (
                          <p className="text-gray-900 dark:text-white">{lead.country}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {new Date(lead.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                      <p className="text-gray-900 dark:text-white text-sm">
                        {new Date(lead.updatedAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Lead Tasks */}
                <LeadTasks leadId={lead.id} />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* AI Floating Action Button */}
      <AIFab />

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