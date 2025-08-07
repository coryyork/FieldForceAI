import React, { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Calendar, DollarSign, Users, Clock, ArrowRight, Star, CheckCircle, Briefcase, Mail, Phone, FileText, X, User, Linkedin, Video, Play, Square, RotateCcw, Upload, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface PublicJobOpening {
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
  applicationDeadline: string | null;
  createdAt: string;
  companyName: string;
}

export default function JobPortal() {
  // Fetch public job openings
  const { data: jobOpenings = [], isLoading } = useQuery<PublicJobOpening[]>({
    queryKey: ["/api/public/job-openings"],
  });

  // Get company name from the first job opening (since they're all from the same company)
  const companyName = jobOpenings.length > 0 ? jobOpenings[0].companyName : "Field Force";

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [selectedJob, setSelectedJob] = useState<PublicJobOpening | null>(null);
  const [applicationStep, setApplicationStep] = useState(1);
  const [applicationData, setApplicationData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    phone: "",
    email: "",
    linkedinUrl: "",
    linkedinConnected: false,
    videoBlob: null as Blob | null,
    videoUrl: "",
  });
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [linkedinConnecting, setLinkedinConnecting] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  // Interview questions
  const interviewQuestions = [
    "Tell us about yourself and why you're interested in this position.",
    "What relevant experience do you have for this role?",
    "What are your greatest strengths and how do they apply to this position?",
    "Where do you see yourself in 5 years?",
    "Why do you want to work for our company?",
    "Do you have any questions for us?"
  ];

  // Filter job openings
  const filteredJobs = jobOpenings.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || job.department === selectedDepartment;
    const matchesLocation = selectedLocation === "all" || job.location === selectedLocation;
    
    return matchesSearch && matchesDepartment && matchesLocation;
  });

  // Get unique departments and locations for filters
  const departments = Array.from(new Set(jobOpenings.map(job => job.department).filter(Boolean))) as string[];
  const locations = Array.from(new Set(jobOpenings.map(job => job.location).filter(Boolean))) as string[];

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate step 1 fields
    if (!applicationData.firstName || !applicationData.lastName || !applicationData.email || !applicationData.phone || !applicationData.address) {
      toast({
        title: "Required Fields Missing",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(applicationData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    setApplicationStep(2);
  };

  const handleLinkedinConnect = async () => {
    if (!applicationData.linkedinUrl) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL.",
        variant: "destructive"
      });
      return;
    }

    // Basic LinkedIn URL validation
    if (!applicationData.linkedinUrl.includes('linkedin.com')) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn profile URL.",
        variant: "destructive"
      });
      return;
    }

    setLinkedinConnecting(true);
    
    // Simulate connection process
    setTimeout(() => {
      setApplicationData(prev => ({ ...prev, linkedinConnected: true }));
      setLinkedinConnecting(false);
      toast({
        title: "LinkedIn Connected!",
        description: "Your LinkedIn profile has been successfully connected.",
      });
    }, 2000);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setApplicationData(prev => ({ ...prev, videoBlob: blob, videoUrl: url }));
      };

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      setCurrentQuestion(0);
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please allow camera and microphone access to record your video.",
        variant: "destructive"
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  const redoRecording = () => {
    setApplicationData(prev => ({ ...prev, videoBlob: null, videoUrl: "" }));
    setCurrentQuestion(0);
  };

  const handleFinalSubmit = async () => {
    if (!applicationData.videoBlob) {
      toast({
        title: "Video Required",
        description: "Please record a video before submitting your application.",
        variant: "destructive"
      });
      return;
    }

    try {
      // In a real implementation, this would upload the video and submit the application
      toast({
        title: "Application Submitted Successfully!",
        description: `Thank you for your comprehensive application to ${selectedJob?.title}. We'll review everything and get back to you soon.`,
      });

      // Reset everything
      setApplicationData({
        firstName: "",
        lastName: "",
        address: "",
        phone: "",
        email: "",
        linkedinUrl: "",
        linkedinConnected: false,
        videoBlob: null,
        videoUrl: "",
      });
      setApplicationStep(1);
      setSelectedJob(null);
      setCurrentQuestion(0);
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-electric-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  {companyName}
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">Career Opportunities</p>
              </div>
            </div>
            <Button variant="outline" className="hidden sm:flex">
              Back to Main Site
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-electric-blue via-blue-600 to-indigo-700 text-white py-20 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Build Your Future
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                With Us
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Join a team that's transforming how businesses operate through innovative technology and exceptional talent
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="flex items-center space-x-2 text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span>Remote-First Culture</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span>Competitive Packages</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <CheckCircle className="w-5 h-5" />
                <span>Growth Opportunities</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-8 border border-gray-200/50 dark:border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search jobs by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 text-lg border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
              />
            </div>
            <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
              <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="h-12 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-electric-blue border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading opportunities...</p>
            </div>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                {jobOpenings.length === 0 ? "No Open Positions" : "No Matching Results"}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {jobOpenings.length === 0 
                  ? "We don't have any open positions at the moment. Check back soon for new opportunities!"
                  : "Try adjusting your search criteria or browse all available positions."
                }
              </p>
              {filteredJobs.length !== jobOpenings.length && (
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedDepartment("all");
                    setSelectedLocation("all");
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Open Positions
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {filteredJobs.length} position{filteredJobs.length > 1 ? 's' : ''} 
                {filteredJobs.length !== jobOpenings.length && ` of ${jobOpenings.length}`} available
              </p>
            </div>

            <div className="grid gap-8">
              {filteredJobs.map((job) => (
                <Card key={job.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:scale-[1.02] overflow-hidden">
                  {/* Gradient top border */}
                  <div className="h-1 bg-gradient-to-r from-electric-blue to-indigo-600"></div>
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-bold mb-3 group-hover:text-electric-blue transition-colors">
                          {job.title}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                          <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1">
                            <Building2 className="w-4 h-4 mr-2" />
                            {job.companyName}
                          </div>
                          {job.department && (
                            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1">
                              <Users className="w-4 h-4 mr-2" />
                              {job.department}
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-full px-3 py-1">
                              <MapPin className="w-4 h-4 mr-2" />
                              {job.location}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 mb-4">
                          <Badge 
                            variant="outline" 
                            className="bg-electric-blue/10 border-electric-blue/20 text-electric-blue hover:bg-electric-blue/20"
                          >
                            {getEmploymentTypeBadge(job.employmentType)}
                          </Badge>
                          <Badge 
                            variant="secondary"
                            className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                          >
                            {getExperienceLevel(job.experienceLevel)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right ml-6">
                        {(job.salaryMin || job.salaryMax) && (
                          <div className="bg-gradient-to-r from-electric-blue to-indigo-600 bg-clip-text text-transparent font-bold text-lg mb-2">
                            {job.salaryMin && job.salaryMax 
                              ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}`
                              : job.salaryMin 
                                ? `From $${Number(job.salaryMin).toLocaleString()}`
                                : `Up to $${Number(job.salaryMax).toLocaleString()}`
                            }
                          </div>
                        )}
                        <div className="text-xs text-gray-500 flex items-center justify-end bg-gray-50 dark:bg-gray-700 rounded-full px-2 py-1">
                          <Clock className="w-3 h-3 mr-1" />
                          Posted {format(new Date(job.createdAt), "MMM d")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-2">
                    <CardDescription className="text-base text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                      {job.description}
                    </CardDescription>

                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {job.requirements && job.requirements.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                            <CheckCircle className="w-4 h-4 mr-2 text-electric-blue" />
                            Key Requirements
                          </h4>
                          <ul className="space-y-2">
                            {job.requirements.slice(0, 4).map((requirement, index) => (
                              <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                <div className="w-1.5 h-1.5 bg-electric-blue rounded-full mt-2 mr-3 flex-shrink-0"></div>
                                {requirement}
                              </li>
                            ))}
                            {job.requirements.length > 4 && (
                              <li className="text-sm text-electric-blue font-medium ml-5">
                                +{job.requirements.length - 4} more requirements
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {job.benefits && job.benefits.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                            <Star className="w-4 h-4 mr-2 text-yellow-500" />
                            Benefits & Perks
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {job.benefits.slice(0, 6).map((benefit, index) => (
                              <Badge 
                                key={index} 
                                variant="outline" 
                                className="text-xs bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
                              >
                                {benefit}
                              </Badge>
                            ))}
                            {job.benefits.length > 6 && (
                              <Badge 
                                variant="outline" 
                                className="text-xs bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
                              >
                                +{job.benefits.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          {job.applicationDeadline && (
                            <div className="flex items-center text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4 mr-2" />
                              Apply by {format(new Date(job.applicationDeadline), "MMM d, yyyy")}
                            </div>
                          )}
                        </div>
                        
                        <Dialog open={selectedJob?.id === job.id} onOpenChange={(open) => {
                          if (!open) {
                            setSelectedJob(null);
                            setApplicationData({
                              fullName: "",
                              email: "",
                              phone: "",
                              coverLetter: "",
                              experience: "",
                              portfolioUrl: ""
                            });
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button 
                              className="bg-gradient-to-r from-electric-blue to-indigo-600 hover:from-electric-blue hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 group"
                              onClick={() => setSelectedJob(job)}
                            >
                              Apply Now
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </DialogTrigger>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Multi-Step Application Modal */}
      {selectedJob && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            setSelectedJob(null);
            setApplicationStep(1);
            setApplicationData({
              firstName: "",
              lastName: "",
              address: "",
              phone: "",
              email: "",
              linkedinUrl: "",
              linkedinConnected: false,
              videoBlob: null,
              videoUrl: "",
            });
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
                Apply for {selectedJob.title}
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                {selectedJob.companyName} - {selectedJob.department && `${selectedJob.department} Department`}
              </DialogDescription>
              
              {/* Progress Indicator */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Step {applicationStep} of 3
                  </span>
                  <span className="text-sm text-gray-500">
                    {applicationStep === 1 && "Personal Information"}
                    {applicationStep === 2 && "LinkedIn Connection"}
                    {applicationStep === 3 && "Video Interview"}
                  </span>
                </div>
                <Progress value={(applicationStep / 3) * 100} className="h-2" />
                
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span className={applicationStep >= 1 ? "text-electric-blue font-medium" : ""}>
                    <User className="w-3 h-3 inline mr-1" />
                    Personal Info
                  </span>
                  <span className={applicationStep >= 2 ? "text-electric-blue font-medium" : ""}>
                    <Linkedin className="w-3 h-3 inline mr-1" />
                    LinkedIn
                  </span>
                  <span className={applicationStep >= 3 ? "text-electric-blue font-medium" : ""}>
                    <Video className="w-3 h-3 inline mr-1" />
                    Video Interview
                  </span>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-6">
              {/* Step 1: Personal Information */}
              {applicationStep === 1 && (
                <form onSubmit={handleStep1Submit} className="space-y-6">
                  <div className="text-center mb-6">
                    <User className="w-12 h-12 text-electric-blue mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h3>
                    <p className="text-gray-600 dark:text-gray-400">Tell us a bit about yourself</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-medium">
                        First Name *
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="John"
                        value={applicationData.firstName}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-medium">
                        Last Name *
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Doe"
                        value={applicationData.lastName}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-medium">
                      Address *
                    </Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="123 Main St, City, State 12345"
                      value={applicationData.address}
                      onChange={(e) => setApplicationData(prev => ({ ...prev, address: e.target.value }))}
                      className="border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Phone Number *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={applicationData.phone}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                        className="border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email Address *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="john.doe@example.com"
                        value={applicationData.email}
                        onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                        className="border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedJob(null)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-gradient-to-r from-electric-blue to-indigo-600 hover:from-electric-blue hover:to-indigo-700 text-white font-semibold"
                    >
                      Continue to LinkedIn
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 2: LinkedIn Connection */}
              {applicationStep === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Linkedin className="w-12 h-12 text-blue-600 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Connect Your LinkedIn</h3>
                    <p className="text-gray-600 dark:text-gray-400">Help us understand your professional background</p>
                  </div>

                  {!applicationData.linkedinConnected ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="linkedinUrl" className="text-sm font-medium">
                          LinkedIn Profile URL *
                        </Label>
                        <Input
                          id="linkedinUrl"
                          type="url"
                          placeholder="https://linkedin.com/in/your-profile"
                          value={applicationData.linkedinUrl}
                          onChange={(e) => setApplicationData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                          className="border-gray-300 dark:border-gray-600 focus:border-electric-blue focus:ring-electric-blue"
                        />
                      </div>

                      <Button
                        type="button"
                        onClick={handleLinkedinConnect}
                        disabled={linkedinConnecting}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {linkedinConnecting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <Linkedin className="w-4 h-4 mr-2" />
                            Connect LinkedIn Profile
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
                        LinkedIn Connected Successfully!
                      </h4>
                      <p className="text-green-600 dark:text-green-300">
                        We've retrieved your professional information from LinkedIn.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 border-green-300 text-green-700 hover:bg-green-100"
                        onClick={() => window.open(applicationData.linkedinUrl, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApplicationStep(1)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setApplicationStep(3)}
                      disabled={!applicationData.linkedinConnected}
                      className="flex-1 bg-gradient-to-r from-electric-blue to-indigo-600 hover:from-electric-blue hover:to-indigo-700 text-white font-semibold"
                    >
                      Continue to Video Interview
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Video Interview */}
              {applicationStep === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <Video className="w-12 h-12 text-electric-blue mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Video Interview</h3>
                    <p className="text-gray-600 dark:text-gray-400">Record yourself answering a few questions</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Video Recording Section */}
                    <div className="space-y-4">
                      <div className="bg-gray-900 rounded-xl overflow-hidden aspect-video relative">
                        {!applicationData.videoUrl ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <video
                            src={applicationData.videoUrl}
                            controls
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {isRecording && (
                          <div className="absolute top-4 left-4 flex items-center space-x-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-white text-sm font-medium">Recording</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {!isRecording && !applicationData.videoUrl && (
                          <Button
                            type="button"
                            onClick={startRecording}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Video className="w-4 h-4 mr-2" />
                            Start Recording
                          </Button>
                        )}

                        {isRecording && (
                          <Button
                            type="button"
                            onClick={stopRecording}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Square className="w-4 h-4 mr-2" />
                            Stop Recording
                          </Button>
                        )}

                        {applicationData.videoUrl && (
                          <>
                            <Button
                              type="button"
                              onClick={redoRecording}
                              variant="outline"
                            >
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Redo Recording
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Questions Section */}
                    <div className="space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                          Interview Questions
                        </h4>
                        <div className="space-y-3">
                          {interviewQuestions.map((question, index) => (
                            <div
                              key={index}
                              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                index === currentQuestion
                                  ? 'border-electric-blue bg-electric-blue/10 text-electric-blue'
                                  : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                              }`}
                              onClick={() => setCurrentQuestion(index)}
                            >
                              <div className="text-xs font-medium mb-1">Question {index + 1}</div>
                              <div className="text-sm">{question}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                        <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Recording Tips:</h5>
                        <ul className="text-sm text-blue-600 dark:text-blue-300 space-y-1">
                          <li>• Ensure good lighting and clear audio</li>
                          <li>• Look directly at the camera</li>
                          <li>• Take your time with each answer</li>
                          <li>• You can review and redo if needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setApplicationStep(2)}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleFinalSubmit}
                      disabled={!applicationData.videoUrl}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Application
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-electric-blue to-indigo-600 rounded-xl flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{companyName}</h3>
                  <p className="text-gray-400 text-sm">Building the future of business</p>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed max-w-md">
                We're on a mission to transform how businesses operate through innovative technology 
                and exceptional talent. Join us in creating solutions that make a difference.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Our Mission</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Leadership Team</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press Kit</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="bg-gray-700 mb-8" />
          
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">
              © 2025 {companyName}. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <Badge variant="outline" className="border-green-500 text-green-400 bg-green-500/10">
                <CheckCircle className="w-3 h-3 mr-1" />
                Equal Opportunity Employer
              </Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}