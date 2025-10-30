import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AuthPage from "./components/auth/AuthPage";
import DiagnosticTest from "./components/diagnostic/DiagnosticTest";
import ProfileSummary from "./components/profile/ProfileSummary";
import Dashboard from "./components/dashboard/Dashboard";
import AdaptivePractice from "./components/adaptive/AdaptivePractice";
import InsightsPage from "./components/insights/InsightsPage";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={session ? <Navigate to="/dashboard" /> : <AuthPage />}
            />
            <Route
              path="/diagnostic"
              element={session ? <DiagnosticTest /> : <Navigate to="/" />}
            />
            <Route
              path="/profile"
              element={session ? <ProfileSummary /> : <Navigate to="/" />}
            />
            <Route
              path="/dashboard"
              element={session ? <Dashboard /> : <Navigate to="/" />}
            />
            <Route
              path="/practice"
              element={session ? <AdaptivePractice /> : <Navigate to="/" />}
            />
            <Route
              path="/insights"
              element={session ? <InsightsPage /> : <Navigate to="/" />}
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
