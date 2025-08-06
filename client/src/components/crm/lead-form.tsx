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
  street: data.street || "",
  city: data.city || "",
  state: data.state || "",
  zipCode: data.zipCode || "",
  country: data.country || "",
  placeId: data.placeId || "",
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
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
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
      street: initialData?.street || "",
      city: initialData?.city || "",
      state: initialData?.state || "",
      zipCode: initialData?.zipCode || "",
      country: initialData?.country || "",
      placeId: initialData?.placeId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: LeadFormData) => {
      const url = leadId ? `/api/leads/${leadId}` : "/api/leads";
      const method = leadId ? "PUT" : "POST";
      
      const leadData = {
        ...data,
        companyId: user?.companyId,
        value: data.value, // Keep as string for decimal field
        probability: parseInt(data.probability) || 0, // Convert to number for integer field
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

  // Company search functionality
  const searchCompanies = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setCompanySearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiRequest(`/api/places/search?query=${encodeURIComponent(query)}`);
      setCompanySearchResults(response || []);
    } catch (error) {
      console.error("Error searching companies:", error);
      setCompanySearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCompany = async (place: any) => {
    try {
      const details = await apiRequest(`/api/places/details/${place.placeId}`);
      
      // Update form with company details
      form.setValue("company", details.name);
      form.setValue("street", details.street || "");
      form.setValue("city", details.city || "");
      form.setValue("state", details.state || "");
      form.setValue("zipCode", details.zipCode || "");
      form.setValue("country", details.country || "");
      form.setValue("placeId", details.placeId || "");
      
      setCompanySearchResults([]);
      
      toast({
        title: "Company Selected",
        description: "Address details have been automatically filled in.",
      });
    } catch (error) {
      console.error("Error getting company details:", error);
      toast({
        title: "Error",
        description: "Failed to get company details",
        variant: "destructive",
      });
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
              <FormItem className="relative">
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Start typing company name..." 
                    {...field} 
                    value={field.value || ""} 
                    onChange={(e) => {
                      field.onChange(e);
                      searchCompanies(e.target.value);
                    }}
                  />
                </FormControl>
                
                {/* Company search results dropdown */}
                {Array.isArray(companySearchResults) && companySearchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg max-h-60 overflow-auto">
                    {companySearchResults.map((place) => (
                      <div
                        key={place.placeId}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b last:border-b-0"
                        onClick={() => selectCompany(place)}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">{place.name}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{place.formattedAddress}</div>
                        {place.rating && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            ⭐ {place.rating} rating
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg p-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Searching companies...</div>
                  </div>
                )}
                
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

        {/* Address Section */}
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Address Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province</FormLabel>
                  <FormControl>
                    <Input placeholder="NY" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ZIP/Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6 border-t">
          <Button type="button" variant="outline" onClick={onSuccess} className="touch-target">
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting}
            onClick={handleButtonClick}
            className="bg-electric-blue hover:bg-blue-600 text-white touch-target min-w-[120px]"
          >
            {isSubmitting ? "Saving..." : leadId ? "Update Lead" : "Create Lead"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
