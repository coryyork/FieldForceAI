import { useQuery } from "@tanstack/react-query";
import { Building2, MapPin, Calendar, DollarSign, Users, Clock } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-electric-blue rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Career Opportunities
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-electric-blue to-blue-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Join Our Team
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Discover exciting career opportunities and be part of our mission to build innovative business solutions
          </p>
        </div>
      </div>

      {/* Job Listings */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-electric-blue"></div>
          </div>
        ) : jobOpenings.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
              No Open Positions
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              We don't have any open positions at the moment. Please check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Open Positions
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {jobOpenings.length} position{jobOpenings.length > 1 ? 's' : ''} available
              </p>
            </div>

            <div className="grid gap-6">
              {jobOpenings.map((job) => (
                <Card key={job.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-electric-blue">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                        <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 mr-1" />
                            {job.companyName}
                          </div>
                          {job.department && (
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {job.department}
                            </div>
                          )}
                          {job.location && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 mb-3">
                          <Badge variant="outline">
                            {getEmploymentTypeBadge(job.employmentType)}
                          </Badge>
                          <Badge variant="secondary">
                            {getExperienceLevel(job.experienceLevel)}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        {(job.salaryMin || job.salaryMax) && (
                          <div className="text-lg font-semibold text-electric-blue mb-1">
                            {job.salaryMin && job.salaryMax 
                              ? `$${Number(job.salaryMin).toLocaleString()} - $${Number(job.salaryMax).toLocaleString()}`
                              : job.salaryMin 
                                ? `From $${Number(job.salaryMin).toLocaleString()}`
                                : `Up to $${Number(job.salaryMax).toLocaleString()}`
                            }
                          </div>
                        )}
                        <div className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Posted {format(new Date(job.createdAt), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-base mb-4 line-clamp-3">
                      {job.description}
                    </CardDescription>

                    {job.requirements && job.requirements.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Requirements</h4>
                        <ul className="space-y-1">
                          {job.requirements.slice(0, 3).map((requirement, index) => (
                            <li key={index} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                              <span className="w-2 h-2 bg-electric-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {requirement}
                            </li>
                          ))}
                          {job.requirements.length > 3 && (
                            <li className="text-sm text-gray-500 ml-5">
                              +{job.requirements.length - 3} more requirements
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {job.benefits && job.benefits.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Benefits</h4>
                        <div className="flex flex-wrap gap-2">
                          {job.benefits.slice(0, 4).map((benefit, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {benefit}
                            </Badge>
                          ))}
                          {job.benefits.length > 4 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.benefits.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Separator className="my-4" />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                        {job.applicationDeadline && (
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Apply by {format(new Date(job.applicationDeadline), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="bg-electric-blue hover:bg-blue-600 text-white"
                        onClick={() => {
                          // For now, just scroll to top. In a real implementation, 
                          // this would open an application form or redirect to an external application system
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 Field Force. All rights reserved.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Equal Opportunity Employer
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}