import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertCompanySchema, type InsertCompany } from "@shared/schema";
import { Zap } from "lucide-react";

type CompanyFormData = InsertCompany;

export default function Onboarding() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CompanyFormData>({
    resolver: zodResolver(insertCompanySchema),
    defaultValues: {
      name: "",
      domain: "",
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: CompanyFormData) => {
      const response = await apiRequest("POST", "/api/companies", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Welcome to Field Army!",
        description: "Your organization workspace has been created successfully.",
      });
      // Redirect to dashboard
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyFormData) => {
    createCompanyMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-electric-blue rounded-lg flex items-center justify-center electric-blue-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome to Field Army
          </CardTitle>
          <CardDescription>
            Let's set up your organization workspace to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter your organization name" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="domain"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Domain</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="example.com (optional)" 
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full"
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending ? "Creating..." : "Create Workspace"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}