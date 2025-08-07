import { format } from "date-fns";
import { Building2, MapPin, Calendar, DollarSign, Users, Edit, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

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

interface JobOpeningDetailsProps {
  jobOpening: JobOpening;
  onEdit: () => void;
  onClose: () => void;
}

export default function JobOpeningDetails({ jobOpening, onEdit, onClose }: JobOpeningDetailsProps) {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {jobOpening.title}
            </h2>
            <Badge variant={getStatusBadgeVariant(jobOpening.status)}>
              {jobOpening.status.charAt(0).toUpperCase() + jobOpening.status.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
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
          </div>
        </div>
        <Button onClick={onEdit} className="bg-electric-blue hover:bg-blue-600 text-white">
          <Edit className="w-4 h-4 mr-2" />
          Edit Job Opening
        </Button>
      </div>

      <Separator />

      {/* Job Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Job Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Employment Type</h4>
                <p className="text-gray-600 dark:text-gray-400">{getEmploymentTypeBadge(jobOpening.employmentType)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">Experience Level</h4>
                <p className="text-gray-600 dark:text-gray-400">{getExperienceLevel(jobOpening.experienceLevel)}</p>
              </div>
            </div>
            
            {(jobOpening.salaryMin || jobOpening.salaryMax) && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Salary Range
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {jobOpening.salaryMin && jobOpening.salaryMax 
                    ? `$${Number(jobOpening.salaryMin).toLocaleString()} - $${Number(jobOpening.salaryMax).toLocaleString()} annually`
                    : jobOpening.salaryMin 
                      ? `From $${Number(jobOpening.salaryMin).toLocaleString()} annually`
                      : `Up to $${Number(jobOpening.salaryMax).toLocaleString()} annually`
                  }
                </p>
              </div>
            )}
            
            {jobOpening.applicationDeadline && (
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Application Deadline
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {format(new Date(jobOpening.applicationDeadline), "MMMM d, yyyy")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Created</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {format(new Date(jobOpening.createdAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-gray-100">Last Updated</h4>
              <p className="text-gray-600 dark:text-gray-400">
                {format(new Date(jobOpening.updatedAt), "MMMM d, yyyy 'at' h:mm a")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Job Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Job Description</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap">{jobOpening.description}</p>
          </div>
        </CardContent>
      </Card>

      {/* Requirements */}
      {jobOpening.requirements && jobOpening.requirements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {jobOpening.requirements.map((requirement, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-electric-blue rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{requirement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Benefits */}
      {jobOpening.benefits && jobOpening.benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <XCircle className="w-5 h-5 mr-2 text-electric-blue" />
              Benefits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {jobOpening.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-gray-700 dark:text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit} className="bg-electric-blue hover:bg-blue-600 text-white">
          <Edit className="w-4 h-4 mr-2" />
          Edit Job Opening
        </Button>
      </div>
    </div>
  );
}