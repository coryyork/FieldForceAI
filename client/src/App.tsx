import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { ThemeProvider } from "@/hooks/use-theme";
import AIFab from "@/components/ai/ai-fab";
import AuthPage from "@/pages/auth-page";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import Landing from "@/pages/landing";
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
import TeamPage from "@/pages/team";
import InvitationPage from "@/pages/invitation";
import Analytics from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function isPublicPath(path: string) {
  return (
    path === "/auth" ||
    path.startsWith("/invitation/") ||
    path === "/jobs" ||
    path.startsWith("/jobs/")
  );
}

function Router() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return null;
  }

  // Show onboarding if user is authenticated but doesn't have a company
  const needsOnboarding = user && !user.companyId;

  if (needsOnboarding) {
    return <Onboarding />;
  }

  return (
    <Switch>
      {/* Public routes - accessible without authentication */}
      <Route path="/auth" component={AuthPage} />
      <Route path="/invitation/:token" component={InvitationPage} />
      <Route path="/jobs" component={JobPortal} />
      <Route path="/jobs/:jobId" component={JobPortal} />
      
      {/* Public landing for visitors, dashboard for signed-in users */}
      <Route path="/">{user ? <Dashboard /> : <Landing />}</Route>

      {/* Protected routes - require authentication */}
      <ProtectedRoute path="/sales" component={CRM} />
      <ProtectedRoute path="/sales/lead/:id" component={LeadDetails} />
      <ProtectedRoute path="/ai-assistant" component={AIAssistant} />
      <ProtectedRoute path="/knowledge-base" component={KnowledgeBase} />
      <ProtectedRoute path="/ai-settings" component={AISettings} />
      <ProtectedRoute path="/tasks" component={TasksPage} />
      <ProtectedRoute path="/recruitment" component={Recruitment} />
      <ProtectedRoute path="/candidates" component={Candidates} />
      <ProtectedRoute path="/candidates/:id" component={CandidateDetails} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/team" component={TeamPage} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

/** Persistent AI widget — stays mounted across authenticated page navigations so voice sessions survive. */
function PersistentAIFab() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading || !user?.companyId || isPublicPath(location)) {
    return null;
  }

  return <AIFab />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <PersistentAIFab />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
