import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Calendar, DollarSign, Users, Clock, ArrowRight, Star, CheckCircle, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
                        
                        <Button 
                          className="bg-gradient-to-r from-electric-blue to-indigo-600 hover:from-electric-blue hover:to-indigo-700 text-white font-semibold px-6 py-2 rounded-xl transition-all duration-300 hover:shadow-lg hover:scale-105 group"
                          onClick={() => {
                            // For now, just scroll to top. In a real implementation, 
                            // this would open an application form or redirect to an external application system
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        >
                          Apply Now
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

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