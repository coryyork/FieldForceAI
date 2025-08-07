import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import AIFab from "@/components/ai/ai-fab";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Brain, Bot, Sparkles, Save, RotateCcw, Mic, Volume2, X, Plus } from "lucide-react";
import { z } from "zod";

const aiSettingsSchema = z.object({
  aiName: z.string().min(1, "AI name is required").max(50, "AI name must be 50 characters or less"),
  personalityKeywords: z.array(z.string()).default([]),
  autoSuggestions: z.boolean(),
  voiceEnabled: z.boolean(),
  voiceId: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]),
  voiceSpeed: z.number().min(0.25).max(4.0),
});

type AISettingsData = z.infer<typeof aiSettingsSchema>;

export default function AISettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [keywordInput, setKeywordInput] = useState("");

  const form = useForm<AISettingsData>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      aiName: "AI Assistant",
      personalityKeywords: [],
      autoSuggestions: true,
      voiceEnabled: false,
      voiceId: "alloy",
      voiceSpeed: 1.0,
    },
  });

  // Get current AI settings
  const { data: settings, isLoading } = useQuery<{
    aiName?: string;
    personalityKeywords?: string;
    autoSuggestions?: boolean;
    voiceEnabled?: boolean;
    voiceId?: string;
    voiceSpeed?: string | number;
  }>({
    queryKey: ["/api/ai-settings"],
    retry: false,
  });

  // Update form when settings are loaded
  React.useEffect(() => {
    if (settings && !form.formState.isDirty) {
      let keywords: string[] = [];
      try {
        keywords = settings.personalityKeywords ? JSON.parse(settings.personalityKeywords) : [];
      } catch {
        keywords = [];
      }
      
      form.reset({
        aiName: settings.aiName || "AI Assistant",
        personalityKeywords: keywords,
        autoSuggestions: settings.autoSuggestions ?? true,
        voiceEnabled: settings.voiceEnabled ?? false,
        voiceId: (settings.voiceId as "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer") || "alloy",
        voiceSpeed: settings.voiceSpeed ? parseFloat(settings.voiceSpeed.toString()) : 1.0,
      });
    }
  }, [settings]);

  const mutation = useMutation({
    mutationFn: async (data: AISettingsData) => {
      const response = await apiRequest("/api/ai-settings", {
        method: "POST",
        body: {
          ...data,
          personalityKeywords: JSON.stringify(data.personalityKeywords),
        },
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-settings"] });
      toast({
        title: "Settings Updated",
        description: "Your AI assistant settings have been saved successfully.",
      });
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
        description: "Failed to update AI settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: AISettingsData) => {
    await mutation.mutateAsync(data);
  };

  const resetToDefaults = () => {
    form.reset({
      aiName: "AI Assistant",
      personalityKeywords: [],
      autoSuggestions: true,
      voiceEnabled: false,
      voiceId: "alloy",
      voiceSpeed: 1.0,
    });
    setKeywordInput("");
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !form.getValues("personalityKeywords").includes(keyword)) {
      const currentKeywords = form.getValues("personalityKeywords");
      form.setValue("personalityKeywords", [...currentKeywords, keyword]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (keywordToRemove: string) => {
    const currentKeywords = form.getValues("personalityKeywords");
    form.setValue("personalityKeywords", currentKeywords.filter(k => k !== keywordToRemove));
  };

  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-electric-blue/10 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-electric-blue" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Settings</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Customize your AI assistant's personality and behavior
              </p>
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* AI Identity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="w-5 h-5 text-electric-blue" />
                  <span>AI Identity</span>
                </CardTitle>
                <CardDescription>
                  Give your AI assistant a unique name and personality that fits your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="aiName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>AI Assistant Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Alex, ARIA, Assistant" 
                          {...field} 
                          className="max-w-md"
                        />
                      </FormControl>
                      <FormDescription>
                        This name will appear in the chat interface and throughout the platform
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="personalityKeywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personality Keywords</FormLabel>
                      <FormControl>
                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Type a keyword and press Enter (e.g., professional, friendly, helpful)"
                              value={keywordInput}
                              onChange={(e) => setKeywordInput(e.target.value)}
                              onKeyPress={handleKeywordKeyPress}
                              className="flex-1"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addKeyword}
                              disabled={!keywordInput.trim()}
                              className="shrink-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {/* Display current keywords as badges */}
                          <div className="flex flex-wrap gap-2 min-h-[2.5rem] p-3 border rounded-md bg-gray-50 dark:bg-gray-800">
                            {field.value.length === 0 ? (
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                No keywords added yet. Try: professional, helpful, creative, technical
                              </span>
                            ) : (
                              field.value.map((keyword, index) => (
                                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                  {keyword}
                                  <button
                                    type="button"
                                    onClick={() => removeKeyword(keyword)}
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
                        Keywords help shape how your AI assistant communicates. Examples: professional, friendly, creative, technical, concise, detailed
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Auto Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-electric-blue" />
                  <span>Chat Features</span>
                </CardTitle>
                <CardDescription>
                  Configure additional features for your AI assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="autoSuggestions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Auto Suggestions</FormLabel>
                        <FormDescription>
                          Show suggested actions and quick prompts in chat
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 text-electric-blue rounded border-gray-300 focus:ring-electric-blue"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Mic className="w-5 h-5 text-electric-blue" />
                  <span>Voice Settings</span>
                </CardTitle>
                <CardDescription>
                  Enable voice conversations with your AI assistant using OpenAI's realistic voices
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="voiceEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Voice Conversations</FormLabel>
                        <FormDescription>
                          Allow voice input and audio responses for more natural interactions
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="w-4 h-4 text-electric-blue rounded border-gray-300 focus:ring-electric-blue"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {form.watch("voiceEnabled") && (
                  <>
                    <FormField
                      control={form.control}
                      name="voiceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center space-x-2">
                            <Volume2 className="w-4 h-4 text-electric-blue" />
                            <span>Voice Selection</span>
                          </FormLabel>
                          <FormDescription>
                            Choose a voice personality for your AI assistant
                          </FormDescription>
                          <FormControl>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                              {[
                                { value: "alloy", label: "Alloy", desc: "Neutral and balanced" },
                                { value: "echo", label: "Echo", desc: "Warm and engaging" },
                                { value: "fable", label: "Fable", desc: "Expressive and dynamic" },
                                { value: "onyx", label: "Onyx", desc: "Deep and authoritative" },
                                { value: "nova", label: "Nova", desc: "Friendly and energetic" },
                                { value: "shimmer", label: "Shimmer", desc: "Clear and articulate" },
                              ].map((voice) => (
                                <button
                                  key={voice.value}
                                  type="button"
                                  onClick={() => {
                                    console.log("Voice clicked:", voice.value);
                                    field.onChange(voice.value);
                                  }}
                                  className={`p-4 border rounded-lg cursor-pointer transition-all text-left ${
                                    field.value === voice.value
                                      ? "border-electric-blue bg-electric-blue/5 ring-2 ring-electric-blue/20"
                                      : "border-gray-200 dark:border-gray-700 hover:border-electric-blue/50"
                                  }`}
                                >
                                  <div className="font-medium text-sm">{voice.label}</div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {voice.desc}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="voiceSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Voice Speed</FormLabel>
                          <FormDescription>
                            Adjust the speaking pace (0.25x - 4.0x)
                          </FormDescription>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Slower</span>
                            <input
                              type="range"
                              min="0.25"
                              max="4"
                              step="0.25"
                              value={field.value}
                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                              className="flex-1"
                            />
                            <span className="text-sm text-gray-600">Faster</span>
                            <div className="w-12 text-center font-medium">
                              {field.value}x
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Actions */}
            <div className="flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={resetToDefaults}
                className="flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </Button>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={mutation.isPending || !form.formState.isDirty}
                  className="bg-electric-blue hover:bg-blue-600 text-white flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{mutation.isPending ? "Saving..." : "Save Changes"}</span>
                </Button>
              </div>
            </div>
          </form>
        </Form>
          </div>
        </div>
      </div>
      <AIFab />
    </div>
  );
}