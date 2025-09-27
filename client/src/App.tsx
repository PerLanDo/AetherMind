import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { useGlobalKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import AuthPage from "@/pages/AuthPage";
import ProjectsPage from "@/pages/ProjectsPage";
import FilesPage from "@/pages/FilesPage";
import TasksPage from "@/pages/TasksPage";
import AIToolsPage from "@/pages/AIToolsPage";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/components/Dashboard";
import ThemeToggle from "@/components/ThemeToggle";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function HomePage() {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div /> {/* Spacer */}
          <ThemeToggle />
        </div>
        <Dashboard />
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={ProjectsPage} />
      <Route path="/dashboard" component={HomePage} />
      <Route path="/files" component={FilesPage} />
      <Route path="/tasks" component={TasksPage} />
      <Route path="/ai-tools" component={AIToolsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Initialize global keyboard shortcuts
  useGlobalKeyboardShortcuts();
  
  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={() => {}} />;
  }

  // Show main app if authenticated
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Router />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <AuthenticatedApp />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
