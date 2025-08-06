import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, Users, Brain, FileText, BarChart, CheckCircle } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-electric-blue rounded-lg flex items-center justify-center electric-blue-glow">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-wide">
              FIELD FORCE
            </div>
          </div>
          <Button onClick={handleLogin} className="bg-electric-blue hover:bg-blue-600 text-white">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            AI-Powered Business
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> Platform</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Combine CRM functionality with intelligent AI search capabilities. 
            Manage leads, organize knowledge, and get insights across all your business data.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleLogin} size="lg" className="bg-electric-blue hover:bg-blue-600 text-white px-8 py-4 text-lg">
              Get Started Free
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything You Need to Scale
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Powerful tools designed for modern businesses
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-200 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                CRM & Lead Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Track leads, manage pipelines, and convert prospects into customers with our intuitive CRM system.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-cyan-200 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                AI Assistant
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Search across all your business data with natural language queries and get intelligent insights.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-green-200 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Knowledge Base
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Store, organize, and search through your company documents and information effortlessly.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-200 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BarChart className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Analytics & Insights
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Get real-time metrics and AI-powered insights to make data-driven business decisions.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-indigo-200 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Task Management
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Create, assign, and track tasks to keep your team productive and organized.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-orange-200 transition-colors">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Multi-Tenant Platform
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Secure, scalable architecture that grows with your business and keeps data isolated.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of companies using Field Force to streamline their operations.
          </p>
          <Button onClick={handleLogin} size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg">
            Start Your Free Trial
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-gray-600 dark:text-gray-400">
          <p>&copy; 2025 Field Force. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
