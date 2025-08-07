import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  ExternalLink,
  FileText,
  Video,
  CheckCircle,
  Clock,
  XCircle,
  User,
  Briefcase,
  Building
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  reviewing: { label: "Reviewing", color: "bg-yellow-100 text-yellow-800", icon: Eye },
  interviewed: { label: "Interviewed", color: "bg-purple-100 text-purple-800", icon: Video },
  hired: { label: "Hired", color: "bg-green-100 text-green-800", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
};

export default function Candidates() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithJobDetails | null>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidates with job details
  const { data: candidates = [], isLoading } = useQuery<CandidateWithJobDetails[]>({
    queryKey: ["/api/job-applications"],
  });

  // Update candidate mutation
  const updateCandidateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      return apiRequest(`/api/job-applications/${id}`, {
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
      setSelectedCandidate(null);
      setStatusUpdate("");
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update candidate",
        variant: "destructive",
      });
    },
  });

  // Filter candidates
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = 
      candidate.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    updateCandidateMutation.mutate({
      id: selectedCandidate.id,
      status: statusUpdate || selectedCandidate.status,
      notes: notes,
    });
  };

  const openCandidateDetails = (candidate: CandidateWithJobDetails) => {
    setSelectedCandidate(candidate);
    setStatusUpdate(candidate.status);
    setNotes(candidate.notes || "");
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">All Candidates</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all job applications and candidate submissions</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <Users className="w-4 h-4" />
          <span>{filteredCandidates.length} candidates</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search by name, email, or job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="reviewing">Reviewing</SelectItem>
            <SelectItem value="interviewed">Interviewed</SelectItem>
            <SelectItem value="hired">Hired</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Candidates List */}
      <div className="grid gap-4">
        {filteredCandidates.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Candidates Found</h3>
              <p className="text-gray-600 dark:text-gray-400">
                {candidates.length === 0 
                  ? "No applications have been submitted yet." 
                  : "No candidates match your current filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCandidates.map((candidate) => {
            const StatusIcon = statusConfig[candidate.status as keyof typeof statusConfig]?.icon || User;
            const statusStyle = statusConfig[candidate.status as keyof typeof statusConfig]?.color || "bg-gray-100 text-gray-800";
            const statusLabel = statusConfig[candidate.status as keyof typeof statusConfig]?.label || candidate.status;

            return (
              <Card key={candidate.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {candidate.firstName} {candidate.lastName}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Briefcase className="w-4 h-4 mr-2" />
                            Applied for: <span className="font-medium ml-1">{candidate.jobTitle}</span>
                          </div>
                        </div>
                        <Badge className={`${statusStyle} border-0`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusLabel}
                        </Badge>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center text-sm">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:underline">
                            {candidate.email}
                          </a>
                        </div>
                        <div className="flex items-center text-sm">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <a href={`tel:${candidate.phone}`} className="text-blue-600 hover:underline">
                            {candidate.phone}
                          </a>
                        </div>
                        <div className="flex items-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{candidate.address}</span>
                        </div>
                      </div>

                      {/* Job Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                        {candidate.jobDepartment && (
                          <div className="flex items-center">
                            <Building className="w-4 h-4 mr-2" />
                            {candidate.jobDepartment}
                          </div>
                        )}
                        {candidate.jobLocation && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {candidate.jobLocation}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          Applied {format(new Date(candidate.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>

                      {/* Additional Info */}
                      <div className="flex items-center gap-4">
                        {candidate.linkedinUrl && (
                          <a 
                            href={candidate.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center text-blue-600 hover:underline text-sm"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            LinkedIn Profile
                          </a>
                        )}
                        {candidate.videoUrl && (
                          <div className="flex items-center text-green-600 text-sm">
                            <Video className="w-4 h-4 mr-1" />
                            Video Interview Available
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-6">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openCandidateDetails(candidate)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {selectedCandidate?.firstName} {selectedCandidate?.lastName}
                            </DialogTitle>
                            <DialogDescription>
                              Application for {selectedCandidate?.jobTitle}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-6">
                            {/* Contact Information */}
                            <div>
                              <h4 className="font-semibold mb-3">Contact Information</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium">Email</Label>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCandidate?.email}</p>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium">Phone</Label>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCandidate?.phone}</p>
                                </div>
                                <div className="sm:col-span-2">
                                  <Label className="text-sm font-medium">Address</Label>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCandidate?.address}</p>
                                </div>
                                {selectedCandidate?.linkedinUrl && (
                                  <div className="sm:col-span-2">
                                    <Label className="text-sm font-medium">LinkedIn Profile</Label>
                                    <a 
                                      href={selectedCandidate.linkedinUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline block"
                                    >
                                      {selectedCandidate.linkedinUrl}
                                    </a>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Video Interview */}
                            {selectedCandidate?.videoUrl && (
                              <div>
                                <h4 className="font-semibold mb-3">Video Interview</h4>
                                <video 
                                  src={selectedCandidate.videoUrl} 
                                  controls 
                                  className="w-full rounded-lg"
                                  style={{ maxHeight: "300px" }}
                                />
                              </div>
                            )}

                            {/* Update Status and Notes */}
                            <form onSubmit={handleUpdateCandidate} className="space-y-4">
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

                              <div>
                                <Label htmlFor="notes">Internal Notes</Label>
                                <Textarea
                                  id="notes"
                                  placeholder="Add internal notes about this candidate..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  rows={4}
                                />
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setSelectedCandidate(null)}>
                                  Cancel
                                </Button>
                                <Button type="submit" disabled={updateCandidateMutation.isPending}>
                                  {updateCandidateMutation.isPending ? "Updating..." : "Update Candidate"}
                                </Button>
                              </div>
                            </form>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}