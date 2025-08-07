import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Plus, X, Save, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

const jobOpeningSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  department: z.string().optional(),
  location: z.string().optional(),
  employmentType: z.enum(["full_time", "part_time", "contract", "internship"]),
  experienceLevel: z.enum(["entry_level", "mid_level", "senior_level", "executive"]),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  requirements: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  status: z.enum(["active", "paused", "closed", "draft"]),
  publishedOnPortal: z.boolean().default(false),
  applicationDeadline: z.string().optional(),
});

type JobOpeningFormData = z.infer<typeof jobOpeningSchema>;

interface JobOpeningFormProps {
  jobOpening?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function JobOpeningForm({ jobOpening, onSuccess, onCancel }: JobOpeningFormProps) {
  const { toast } = useToast();
  const [requirementInput, setRequirementInput] = useState("");
  const [benefitInput, setBenefitInput] = useState("");

  const isEditing = !!jobOpening;

  const form = useForm<JobOpeningFormData>({
    resolver: zodResolver(jobOpeningSchema),
    defaultValues: {
      title: jobOpening?.title || "",
      description: jobOpening?.description || "",
      department: jobOpening?.department || "",
      location: jobOpening?.location || "",
      employmentType: jobOpening?.employmentType || "full_time",
      experienceLevel: jobOpening?.experienceLevel || "mid_level",
      salaryMin: jobOpening?.salaryMin || "",
      salaryMax: jobOpening?.salaryMax || "",
      requirements: jobOpening?.requirements || [],
      benefits: jobOpening?.benefits || [],
      status: jobOpening?.status || "draft",
      publishedOnPortal: jobOpening?.publishedOnPortal || false,
      applicationDeadline: jobOpening?.applicationDeadline 
        ? new Date(jobOpening.applicationDeadline).toISOString().split('T')[0]
        : "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: JobOpeningFormData) => {
      const endpoint = isEditing 
        ? `/api/job-openings/${jobOpening.id}`
        : "/api/job-openings";
      
      const method = isEditing ? "PUT" : "POST";

      const payload = {
        ...data,
        salaryMin: data.salaryMin ? parseFloat(data.salaryMin) : null,
        salaryMax: data.salaryMax ? parseFloat(data.salaryMax) : null,
        applicationDeadline: data.applicationDeadline || null,
      };

      return await apiRequest(endpoint, {
        method,
        body: payload,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-openings"] });
      toast({
        title: isEditing ? "Job Opening Updated" : "Job Opening Created",
        description: isEditing 
          ? "The job opening has been successfully updated."
          : "New job opening has been created successfully.",
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save job opening. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: JobOpeningFormData) => {
    await mutation.mutateAsync(data);
  };

  const addRequirement = () => {
    const requirement = requirementInput.trim();
    if (requirement && !form.getValues("requirements").includes(requirement)) {
      const currentRequirements = form.getValues("requirements");
      form.setValue("requirements", [...currentRequirements, requirement], { shouldDirty: true });
      setRequirementInput("");
    }
  };

  const removeRequirement = (requirementToRemove: string) => {
    const currentRequirements = form.getValues("requirements");
    form.setValue("requirements", currentRequirements.filter(r => r !== requirementToRemove), { shouldDirty: true });
  };

  const addBenefit = () => {
    const benefit = benefitInput.trim();
    if (benefit && !form.getValues("benefits").includes(benefit)) {
      const currentBenefits = form.getValues("benefits");
      form.setValue("benefits", [...currentBenefits, benefit], { shouldDirty: true });
      setBenefitInput("");
    }
  };

  const removeBenefit = (benefitToRemove: string) => {
    const currentBenefits = form.getValues("benefits");
    form.setValue("benefits", currentBenefits.filter(b => b !== benefitToRemove), { shouldDirty: true });
  };

  const handleRequirementKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addRequirement();
    }
  };

  const handleBenefitKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addBenefit();
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Senior Software Engineer"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., Engineering, Sales, Marketing"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Job Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the role, responsibilities, and what makes this position exciting..."
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g., San Francisco, CA or Remote"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employment Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employment type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="experienceLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience Level</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="entry_level">Entry Level</SelectItem>
                    <SelectItem value="mid_level">Mid Level</SelectItem>
                    <SelectItem value="senior_level">Senior Level</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publishedOnPortal"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-medium">
                    Publish on Job Portal
                  </FormLabel>
                </div>
                <FormDescription>
                  Make this job visible to external candidates
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="salaryMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 80000"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Annual salary in USD</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="salaryMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Salary</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g., 120000"
                    {...field}
                  />
                </FormControl>
                <FormDescription>Annual salary in USD</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="applicationDeadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Application Deadline</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Requirements */}
        <FormField
          control={form.control}
          name="requirements"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Requirements</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a requirement (e.g., 3+ years experience with React)"
                      value={requirementInput}
                      onChange={(e) => setRequirementInput(e.target.value)}
                      onKeyPress={handleRequirementKeyPress}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addRequirement}
                      disabled={!requirementInput.trim()}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                    {field.value.length === 0 ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No requirements added yet
                      </span>
                    ) : (
                      field.value.map((requirement, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {requirement}
                          <button
                            type="button"
                            onClick={() => removeRequirement(requirement)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Add specific skills, experience, or qualifications required for this role
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Benefits */}
        <FormField
          control={form.control}
          name="benefits"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Benefits</FormLabel>
              <FormControl>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a benefit (e.g., Health insurance, Remote work)"
                      value={benefitInput}
                      onChange={(e) => setBenefitInput(e.target.value)}
                      onKeyPress={handleBenefitKeyPress}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addBenefit}
                      disabled={!benefitInput.trim()}
                      className="shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                    {field.value.length === 0 ? (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        No benefits added yet
                      </span>
                    ) : (
                      field.value.map((benefit, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {benefit}
                          <button
                            type="button"
                            onClick={() => removeBenefit(benefit)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
              </FormControl>
              <FormDescription>
                Highlight the perks and benefits that make this role attractive
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end space-x-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="bg-electric-blue hover:bg-blue-600 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {mutation.isPending 
              ? (isEditing ? "Updating..." : "Creating...") 
              : (isEditing ? "Update Job Opening" : "Create Job Opening")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}