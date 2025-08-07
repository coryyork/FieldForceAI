import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { insertDocumentSchema } from "@shared/schema";
import { z } from "zod";
import { Upload, File } from "lucide-react";

const documentFormSchema = insertDocumentSchema.omit({
  companyId: true,
  uploadedBy: true,
  fileSize: true,
  fileType: true,
}).extend({
  tags: z.string().optional(),
  content: z.string().optional(),
  isPublic: z.boolean(),
});

type DocumentFormData = z.infer<typeof documentFormSchema>;

interface DocumentUploadProps {
  onSuccess: () => void;
}

export default function DocumentUpload({ onSuccess }: DocumentUploadProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      title: "",
      content: "",
      tags: "",
      isPublic: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      // For now, we'll simulate document upload by creating a text-based document
      // In a real implementation, you would handle file upload to a storage service
      
      const documentData = {
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        fileType: selectedFile ? selectedFile.type : 'text/plain',
        fileSize: selectedFile ? selectedFile.size : (data.content?.length || 0),
      };

      const response = await apiRequest("/api/documents", {
        method: "POST",
        body: documentData,
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
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
        description: "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: DocumentFormData) => {
    setIsSubmitting(true);
    try {
      await mutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Auto-fill title if empty
      if (!form.getValues('title')) {
        form.setValue('title', file.name.replace(/\.[^/.]+$/, ""));
      }

      // If it's a text file, try to read its content
      if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          if (content && content.length < 10000) { // Limit content size
            form.setValue('content', content);
          }
        };
        reader.readAsText(file);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload Section */}
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
          <div className="text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-4" />
            <div className="mb-4">
              <label
                htmlFor="file-upload"
                className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-electric-blue hover:bg-blue-600"
              >
                <File className="w-4 h-4 mr-2" />
                Choose File
              </label>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
            </div>
            {selectedFile ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Or create a text document below. Supported formats: TXT, MD, PDF, DOC, XLS, PPT
              </p>
            )}
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Document Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter document title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Content</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter document content or description..."
                  className="min-h-[120px] resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This will be searchable through the AI assistant
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="marketing, strategy, pricing (comma-separated)" {...field} />
              </FormControl>
              <FormDescription>
                Use tags to categorize and organize your documents
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPublic"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Public Document</FormLabel>
                <FormDescription>
                  Make this document visible to all team members
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || (!selectedFile && !form.watch('content'))}
            className="bg-electric-blue hover:bg-blue-600 text-white"
          >
            {isSubmitting ? "Uploading..." : "Upload Document"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
