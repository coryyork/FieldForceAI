import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { StageBadge, type CandidateStage } from "@/components/recruitment/stage-selector";
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
  status: CandidateStage;
  notes: string | null;
  createdAt: string;
  jobTitle: string;
  jobDepartment: string | null;
  jobLocation: string | null;
  jobOpeningId: string;
}

const stageFilterOptions = [
  { value: "all", label: "All Stages" },
  { value: "applied", label: "Applied" },
  { value: "1st_round", label: "1st Round Interview" },
  { value: "2nd_round", label: "2nd Round Interview" },
  { value: "offered", label: "Offered" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export default function Candidates() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithJobDetails | null>(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch candidates with job details
  const { data: candidates = [], isLoading } = useQuery<CandidateWithJobDetails[]>({
    queryKey: ["/api/job-applications"],
    enabled: isAuthenticated,
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
    
    const matchesStage = stageFilter === "all" || candidate.status === stageFilter;
    
    return matchesSearch && matchesStage;
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
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </main>
        </div>
        <AIFab />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-auto">
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
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter by stage" />
          </SelectTrigger>
          <SelectContent>
            {stageFilterOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
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
                        <StageBadge stage={candidate.status} />
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/candidates/${candidate.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
          </div>
        </main>
      </div>
      <AIFab />
    </div>
  );
}