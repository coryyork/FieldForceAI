import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Building2, MapPin, Calendar, DollarSign, Users, MoreHorizontal, Edit, Trash, Eye } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import JobOpeningForm from "@/components/recruitment/job-opening-form";
import JobOpeningDetails from "@/components/recruitment/job-opening-details";

interface JobOpening {
  id: string;
  title: string;
  description: string;
  department: string | null;
  location: string | null;
  employmentType: string;
  experienceLevel: string;
  salaryMin: string | null;
  salaryMax: string | null;
  requirements: string[] | null;
  benefits: string[] | null;
  status: string;
  applicationDeadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function Recruitment() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [selectedJobOpening, setSelectedJobOpening] = useState<JobOpening | null>(null);

  // Fetch job openings
  const { data: jobOpenings = [], isLoading } = useQuery<JobOpening[]>({
    queryKey: ["/api/job-openings"],
  });

  // Delete job opening mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/job-openings/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
      toast({
        title: "Job Opening Deleted",
        description: "The job opening has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete job opening. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "paused":
        return "secondary";
      case "closed":
        return "outline";
      case "draft":
        return "secondary";
      default:
        return "default";
    }
  };

  const getEmploymentTypeBadge = (type: string) => {
    switch (type) {
      case "full_time":
        return "Full Time";
      case "part_time":
        return "Part Time";
      case "contract":
        return "Contract";
      case "internship":
        return "Internship";
      default:
        return type;
    }
  };

  const getExperienceLevel = (level: string) => {
    switch (level) {
      case "entry_level":
        return "Entry Level";
      case "mid_level":
        return "Mid Level";
      case "senior_level":
        return "Senior Level";
      case "executive":
        return "Executive";
      default:
        return level;
    }
  };

  const handleEdit = (jobOpening: JobOpening) => {
    setSelectedJobOpening(jobOpening);
    setIsEditDialogOpen(true);
  };

  const handleViewDetails = (jobOpening: JobOpening) => {
    setSelectedJobOpening(jobOpening);
    setIsDetailsDialogOpen(true);
  };

  const handleDelete = async (jobOpening: JobOpening) => {
    if (window.confirm(`Are you sure you want to delete "${jobOpening.title}"?`)) {
      await deleteMutation.mutateAsync(jobOpening.id);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-electric-blue/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-electric-blue" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recruitment</h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Manage job openings and hiring processes
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-electric-blue hover:bg-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Job Opening
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Openings</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{jobOpenings.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobOpenings.filter(job => job.status === 'active').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Draft</CardTitle>
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobOpenings.filter(job => job.status === 'draft').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Closed</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {jobOpenings.filter(job => job.status === 'closed').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Job Openings List */}
            <Card>
              <CardHeader>
                <CardTitle>Job Openings</CardTitle>
                <CardDescription>
                  View and manage all your job openings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
                  </div>
                ) : jobOpenings.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No job openings yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Create your first job opening to start hiring
                    </p>
                    <Button
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="bg-electric-blue hover:bg-blue-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Job Opening
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {jobOpenings.map((jobOpening) => (
                      <Card key={jobOpening.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                  {jobOpening.title}
                                </h3>
                                <Badge variant={getStatusBadgeVariant(jobOpening.status)}>
                                  {jobOpening.status.charAt(0).toUpperCase() + jobOpening.status.slice(1)}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-3">
                                {jobOpening.department && (
                                  <div className="flex items-center">
                                    <Building2 className="w-4 h-4 mr-1" />
                                    {jobOpening.department}
                                  </div>
                                )}
                                {jobOpening.location && (
                                  <div className="flex items-center">
                                    <MapPin className="w-4 h-4 mr-1" />
                                    {jobOpening.location}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {getEmploymentTypeBadge(jobOpening.employmentType)} • {getExperienceLevel(jobOpening.experienceLevel)}
                                </div>
                                {(jobOpening.salaryMin || jobOpening.salaryMax) && (
                                  <div className="flex items-center">
                                    <DollarSign className="w-4 h-4 mr-1" />
                                    {jobOpening.salaryMin && jobOpening.salaryMax 
                                      ? `$${Number(jobOpening.salaryMin).toLocaleString()} - $${Number(jobOpening.salaryMax).toLocaleString()}`
                                      : jobOpening.salaryMin 
                                        ? `From $${Number(jobOpening.salaryMin).toLocaleString()}`
                                        : `Up to $${Number(jobOpening.salaryMax).toLocaleString()}`
                                    }
                                  </div>
                                )}
                              </div>
                              
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                {jobOpening.description}
                              </p>
                              
                              <div className="flex items-center justify-between mt-4">
                                <div className="text-xs text-gray-500">
                                  Created {format(new Date(jobOpening.createdAt), "MMM d, yyyy")}
                                  {jobOpening.applicationDeadline && (
                                    <span className="ml-2">
                                      • Deadline: {format(new Date(jobOpening.applicationDeadline), "MMM d, yyyy")}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewDetails(jobOpening)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(jobOpening)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(jobOpening)}
                                  className="text-red-600"
                                >
                                  <Trash className="w-4 h-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Job Opening Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Job Opening</DialogTitle>
            <DialogDescription>
              Add a new job opening to start attracting candidates
            </DialogDescription>
          </DialogHeader>
          <JobOpeningForm
            onSuccess={() => setIsCreateDialogOpen(false)}
            onCancel={() => setIsCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Job Opening Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Opening</DialogTitle>
            <DialogDescription>
              Update the job opening details
            </DialogDescription>
          </DialogHeader>
          {selectedJobOpening && (
            <JobOpeningForm
              jobOpening={selectedJobOpening}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                setSelectedJobOpening(null);
              }}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedJobOpening(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Job Opening Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Opening Details</DialogTitle>
          </DialogHeader>
          {selectedJobOpening && (
            <JobOpeningDetails
              jobOpening={selectedJobOpening}
              onEdit={() => {
                setIsDetailsDialogOpen(false);
                handleEdit(selectedJobOpening);
              }}
              onClose={() => {
                setIsDetailsDialogOpen(false);
                setSelectedJobOpening(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}