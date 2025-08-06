import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertLeadSchema } from "@shared/schema";
import { z } from "zod";

const leadFormSchema = insertLeadSchema.omit({ companyId: true }).extend({
  value: z.string().transform((val) => val === '' ? '0' : val),
  probability: z.string().transform((val) => val === '' ? '0' : val),
}).transform(data => ({
  ...data,
  name: data.name || "",
  email: data.email || "",
  phone: data.phone || "",
  company: data.company || "",
  title: data.title || "",
  source: data.source || "",
  notes: data.notes || "",
}));

type LeadFormData = z.infer<typeof leadFormSchema>;

interface LeadFormProps {
  onSuccess: () => void;
  initialData?: Partial<LeadFormData>;
  leadId?: string;
}

export default function LeadForm({ onSuccess, initialData, leadId }: LeadFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Get company data
  const { data: company } = useQuery({
    queryKey: ["/api/companies", user?.companyId],
    enabled: !!user?.companyId,
  });

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      company: initialData?.company || "",
      title: initialData?.title || "",
      source: initialData?.source || "",
      stage: initialData?.stage || "new",
      value: initialData?.value?.toString() || "0",
      probability: initialData?.probability?.toString() || "0",
      notes: initialData?.notes || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const url = leadId ? `/api/leads/${leadId}` : "/api/leads";
      const method = leadId ? "PUT" : "POST";
      
      const leadData = {
        ...data,
        companyId: user?.companyId,
        value: data.value,
        probability: data.probability,
      };
      
      console.log("=== SENDING TO BACKEND ===");
      console.log("Lead data:", leadData);
      console.log("Value type:", typeof leadData.value);
      console.log("Probability type:", typeof leadData.probability);
      
      return await apiRequest(url, {
        method,
        body: leadData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Success",
        description: leadId ? "Lead updated successfully" : "Lead created successfully",
      });
      onSuccess();
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
        description: leadId ? "Failed to update lead" : "Failed to create lead",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    console.log("=== FORM SUBMISSION STARTED ===");
    console.log("Form data:", data);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
      console.log("=== FORM SUBMISSION SUCCESS ===");
    } catch (error) {
      console.error("=== FORM SUBMISSION ERROR ===", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add button click handler for debugging
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log("=== BUTTON CLICKED ===");
    console.log("Form state:", form.formState);
    console.log("Form values:", form.getValues());
    console.log("Form errors:", form.formState.errors);
  };

  const stages = [
    { value: "new", label: "New" },
    { value: "qualified", label: "Qualified" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" },
  ];

  const sources = [
    { value: "website", label: "Website" },
    { value: "referral", label: "Referral" },
    { value: "cold_call", label: "Cold Call" },
    { value: "social_media", label: "Social Media" },
    { value: "email_campaign", label: "Email Campaign" },
    { value: "trade_show", label: "Trade Show" },
    { value: "other", label: "Other" },
  ];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Corp" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@acme.com" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input placeholder="CEO" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lead Source</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {sources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stage</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value || "new"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {stages.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deal Value ($)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="10000" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="probability"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Probability (%)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="50" min="0" max="100" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Additional information about this lead..."
                  className="resize-none"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            onClick={handleButtonClick}
            className="bg-electric-blue hover:bg-blue-600 text-white"
          >
            {isSubmitting ? "Saving..." : leadId ? "Update Lead" : "Create Lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
