import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Briefcase, Users, Target, Brain } from "lucide-react";
import { Redirect } from "wouter";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to="/" />;
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(loginData);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    registerMutation.mutate(registerData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Auth Forms */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome back</CardTitle>
                  <CardDescription>
                    Enter your credentials to access your workspace
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input
                        id="login-username"
                        type="text"
                        value={loginData.username}
                        onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        "Login"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
              <Card>
                <CardHeader>
                  <CardTitle>Create account</CardTitle>
                  <CardDescription>
                    Get started with your Field Force workspace
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First name</Label>
                        <Input
                          id="firstName"
                          type="text"
                          value={registerData.firstName}
                          onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last name</Label>
                        <Input
                          id="lastName"
                          type="text"
                          value={registerData.lastName}
                          onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-username">Username</Label>
                      <Input
                        id="register-username"
                        type="text"
                        value={registerData.username}
                        onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        type="password"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right side - Hero Section */}
      <div className="hidden lg:flex items-center justify-center bg-muted p-8">
        <div className="max-w-lg space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-4">Field Force 2</h1>
            <p className="text-lg text-muted-foreground">
              Your all-in-one business platform for managing leads, recruitment, and AI-powered insights
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">CRM & Lead Management</h3>
                <p className="text-sm text-muted-foreground">
                  Track leads through your sales pipeline with powerful CRM tools
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Recruitment Hub</h3>
                <p className="text-sm text-muted-foreground">
                  Manage job openings and track candidates through the hiring process
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Assistant</h3>
                <p className="text-sm text-muted-foreground">
                  Get intelligent insights with voice and text AI capabilities
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Multi-tenant Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  Secure workspace isolation with company-based data management
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}