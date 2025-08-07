import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft,
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ExternalLink,
  Video,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Briefcase,
  Building,
  Edit
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import { useAuth } from "@/hooks/useAuth";

interface CandidateWithJobDetails {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  linkedinUrl: string | null;
  videoUrl: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  jobTitle: string;
  jobDepartment: string | null;
  jobLocation: string | null;
  jobOpeningId: string;
}

const statusConfig = {
  submitted: { label: "Submitted", color: "bg-blue-100 text-blue-800", icon: Clock },
  reviewing: { label: "Reviewing", color: "bg-yellow-100 text-yellow-800", icon: User },
  interviewed: { label: "Interviewed", color: "bg-purple-100 text-purple-800", icon: Video },
  hired: { label: "Hired", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function CandidateDetails() {
  const { isAuthenticated } = useAuth();
  const params = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [notes, setNotes] = useState("");

  const candidateId = params.id;

  // Fetch candidate details
  const { data: candidate, isLoading } = useQuery<CandidateWithJobDetails>({
    queryKey: ["/api/job-applications", candidateId],
    enabled: isAuthenticated && !!candidateId,
  });

  // Update candidate mutation
  const updateCandidateMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes: string }) => {
      return apiRequest(`/api/job-applications/${candidateId}`, {
        method: "PUT",
        body: { status, notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-applications"] });
      toast({
        title: "Candidate Updated",
        description: "Candidate status and notes have been updated successfully.",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update candidate",
        variant: "destructive",
      });
    },
  });

  const handleUpdateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidate) return;

    updateCandidateMutation.mutate({
      status: statusUpdate || candidate.status,
      notes: notes,
    });
  };

  const startEditing = () => {
    if (candidate) {
      setStatusUpdate(candidate.status);
      setNotes(candidate.notes || "");
      setIsEditing(true);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </main>
        </div>
        <AIFab />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6">
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Candidate Not Found</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">The candidate you're looking for doesn't exist or has been removed.</p>
              <Button 
                onClick={() => navigate("/candidates")} 
                className="mt-4"
                variant="outline"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Candidates
              </Button>
            </div>
          </main>
        </div>
        <AIFab />
      </div>
    );
  }

  const StatusIcon = statusConfig[candidate.status as keyof typeof statusConfig]?.icon || User;
  const statusStyle = statusConfig[candidate.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800";
  const statusLabel = statusConfig[candidate.status as keyof typeof statusConfig]?.label || candidate.status;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/candidates")}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Candidates
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {candidate.firstName} {candidate.lastName}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    Application for {candidate.jobTitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className={`${statusStyle} border-0`}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {statusLabel}
                </Badge>
                {!isEditing && (
                  <Button onClick={startEditing} size="sm">
                    <Edit className="w-4 h-4 mr-2" />
                    Update Status
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Email</p>
                      <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                        {candidate.email}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                        {candidate.phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600 dark:text-gray-400">{candidate.address}</p>
                    </div>
                  </div>
                  {candidate.linkedinUrl && (
                    <div className="flex items-center space-x-3">
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">LinkedIn</p>
                        <a 
                          href={candidate.linkedinUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View LinkedIn Profile
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="w-5 h-5 mr-2" />
                    Job Application Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-medium">Position</p>
                    <p className="text-gray-600 dark:text-gray-400">{candidate.jobTitle}</p>
                  </div>
                  {candidate.jobDepartment && (
                    <div className="flex items-center space-x-3">
                      <Building className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Department</p>
                        <p className="text-gray-600 dark:text-gray-400">{candidate.jobDepartment}</p>
                      </div>
                    </div>
                  )}
                  {candidate.jobLocation && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="font-medium">Location</p>
                        <p className="text-gray-600 dark:text-gray-400">{candidate.jobLocation}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium">Applied Date</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {format(new Date(candidate.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Interview */}
            {candidate.videoUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="w-5 h-5 mr-2" />
                    Video Interview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {candidate.videoUrl === "recorded-video-placeholder" ? (
                    <div className="bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                      <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Video Interview Recorded</h4>
                      <p className="text-gray-600 dark:text-gray-400">
                        The candidate has submitted a video interview. In a production system, the actual video file would be stored and playable here.
                      </p>
                      <Badge className="mt-3 bg-blue-100 text-blue-800 border-0">
                        Video Available
                      </Badge>
                    </div>
                  ) : candidate.videoUrl?.startsWith('blob:') ? (
                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
                      <Video className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                      <h4 className="text-lg font-medium text-amber-800 dark:text-amber-200 mb-2">Video Interview Submitted</h4>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        The candidate recorded and submitted a video interview during their application process. The video file is no longer accessible as blob URLs expire after the browser session ends.
                      </p>
                      <div className="mt-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-800 p-2 rounded">
                        In a production environment, video files would be uploaded to permanent cloud storage (AWS S3, Google Cloud Storage, etc.) for persistent access.
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <video 
                        src={candidate.videoUrl} 
                        controls 
                        className="w-full rounded-lg"
                        style={{ maxHeight: "400px" }}
                        onError={(e) => {
                          console.log("Video failed to load:", candidate.videoUrl);
                          const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallbackDiv) {
                            e.currentTarget.style.display = 'none';
                            fallbackDiv.style.display = 'block';
                          }
                        }}
                      />
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center hidden">
                        <Video className="w-8 h-8 text-red-600 mx-auto mb-2" />
                        <p className="text-sm text-red-800 dark:text-red-200">
                          Video interview file could not be loaded. The file may have been moved or deleted.
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Status Update & Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Candidate Management</CardTitle>
                <CardDescription>
                  Update the candidate's status and add internal notes for the recruitment process.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <form onSubmit={handleUpdateCandidate} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="reviewing">Reviewing</SelectItem>
                            <SelectItem value="interviewed">Interviewed</SelectItem>
                            <SelectItem value="hired">Hired</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="notes">Internal Notes</Label>
                      <Textarea
                        id="notes"
                        placeholder="Add internal notes about this candidate..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={6}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        disabled={updateCandidateMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={updateCandidateMutation.isPending}>
                        {updateCandidateMutation.isPending ? "Updating..." : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Label>Current Status</Label>
                      <div className="mt-1">
                        <Badge className={`${statusStyle} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabel}
                        </Badge>
                      </div>
                    </div>
                    {candidate.notes ? (
                      <div>
                        <Label>Internal Notes</Label>
                        <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {candidate.notes}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label>Internal Notes</Label>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                          No notes added yet.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      <AIFab />
    </div>
  );
}