import { Switch, Route, Router as WouterRouter } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Analyze from "@/pages/Analyze";
import Results from "@/pages/Results";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Practice from "@/pages/Practice";
import Profile from "@/pages/Profile";
import AuthCallback from "@/pages/AuthCallback";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { setTokenProvider } from "@/services/api";

const queryClient = new QueryClient();

function TokenWirer() {
  const { getToken } = useAuth();
  useEffect(() => {
    setTokenProvider(getToken);
  }, [getToken]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/analyze" component={Analyze} />
      <Route path="/results" component={Results} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/practice" component={Practice} />
      <Route path="/profile" component={Profile} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AnalysisProvider>
              <WouterRouter>
                <TokenWirer />
                <Router />
              </WouterRouter>
            </AnalysisProvider>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
