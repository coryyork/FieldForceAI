import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/use-theme";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import CRM from "@/pages/crm";
import LeadDetails from "@/pages/lead-details";
import AIAssistant from "@/pages/ai-assistant";
import KnowledgeBase from "@/pages/knowledge-base";
import AISettings from "@/pages/ai-settings";
import TasksPage from "@/pages/tasks";
import Recruitment from "@/pages/recruitment";
import Candidates from "@/pages/candidates";
import CandidateDetails from "@/pages/candidate-details";
import JobPortal from "@/pages/job-portal";
import Settings from "@/pages/settings";
import LoginPage from "@/pages/login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  // Show onboarding if user is authenticated but doesn't have a company
  const needsOnboarding = isAuthenticated && user && !user.companyId;

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/jobs" component={JobPortal} />
      <Route path="/jobs/:jobId" component={JobPortal} />
      
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : needsOnboarding ? (
        <Route path="/" component={Onboarding} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/sales" component={CRM} />
          <Route path="/sales/lead/:id" component={LeadDetails} />
          <Route path="/ai-assistant" component={AIAssistant} />
          <Route path="/knowledge-base" component={KnowledgeBase} />
          <Route path="/ai-settings" component={AISettings} />
          <Route path="/tasks" component={TasksPage} />
          <Route path="/recruitment" component={Recruitment} />
          <Route path="/candidates" component={Candidates} />
          <Route path="/candidates/:id" component={CandidateDetails} />
          <Route path="/settings" component={Settings} />
          <Route path="/login" component={LoginPage} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
