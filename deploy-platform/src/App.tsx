import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/lib/theme";
import LandingPage from "@/pages/landing";
import LoginPage from "@/pages/login";
import DeploymentsPage from "@/pages/deployments";
import DeployNewPage from "@/pages/deploy-new";
import DeployConfigPage from "@/pages/deploy-config";
import DeploymentDetailPage from "@/pages/deployment-detail";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import DocsPage from "@/pages/docs";

const queryClient = new QueryClient();

const AuthGuard = ({ component: Component }: { component: any }) => {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return null;

  return <Component />;
};

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/deployments" component={() => <AuthGuard component={DeploymentsPage} />} />
      <Route path="/deploy/new" component={() => <AuthGuard component={DeployNewPage} />} />
      <Route path="/deploy/config" component={() => <AuthGuard component={DeployConfigPage} />} />
      <Route path="/deployments/:id" component={() => <AuthGuard component={DeploymentDetailPage} />} />
      <Route path="/docs" component={DocsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
