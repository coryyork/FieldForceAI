import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Zap, Mail, Github } from "lucide-react";
import { FaGoogle } from "react-icons/fa";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailLogin, setShowEmailLogin] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        window.location.href = "/";
      } else {
        const error = await response.json();
        console.error("Login failed:", error);
      }
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    window.location.href = `/api/auth/${provider}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-electric-blue rounded-xl flex items-center justify-center electric-blue-glow">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome to Field Force</h1>
            <p className="text-gray-600 dark:text-gray-400">Sign in to access your business dashboard</p>
          </div>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>Choose your preferred sign-in method</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showEmailLogin ? (
              <>
                {/* Social Login Buttons */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => handleSocialLogin("google")}
                  >
                    <FaGoogle className="w-5 h-5 mr-3 text-red-500" />
                    Continue with Google
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => handleSocialLogin("github")}
                  >
                    <Github className="w-5 h-5 mr-3" />
                    Continue with GitHub
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => handleSocialLogin("replit")}
                  >
                    <Zap className="w-5 h-5 mr-3 text-blue-500" />
                    Continue with Replit
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white dark:bg-gray-800 px-2 text-gray-500">Or</span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowEmailLogin(true)}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Sign in with Email
                </Button>
              </>
            ) : (
              <>
                {/* Email/Password Form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your email"
                              type="email"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter your password"
                              type="password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </form>
                </Form>

                <Button
                  variant="ghost"
                  className="w-full text-sm"
                  onClick={() => setShowEmailLogin(false)}
                >
                  ← Back to other options
                </Button>
              </>
            )}

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <a href="/register" className="text-blue-600 hover:underline">
                Sign up here
              </a>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}