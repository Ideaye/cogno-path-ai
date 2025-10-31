import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import AuthPage from "./components/auth/AuthPage";
import DiagnosticTest from "./components/diagnostic/DiagnosticTest";
import ProfileSummary from "./components/profile/ProfileSummary";
import { Dashboard } from "./components/dashboard/Dashboard";
import { AdaptivePractice } from "./components/adaptive/AdaptivePractice";
import InsightsPage from "./components/insights/InsightsPage";
import { CalibrationLab } from "./components/calibration/CalibrationLab";
import { AppLayout } from "./components/layout/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

function App() {
  const [session, setSession] = useState<Session | null>(null);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!session) return <Navigate to="/auth" />;
    return <AppLayout>{children}</AppLayout>;
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={session ? <Navigate to="/dashboard" /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={!session ? <AuthPage /> : <Navigate to="/dashboard" />} />
            <Route path="/diagnostic" element={<ProtectedRoute><DiagnosticTest /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileSummary /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/calibration" element={<ProtectedRoute><CalibrationLab /></ProtectedRoute>} />
            <Route path="/practice" element={<ProtectedRoute><AdaptivePractice /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
            <Route path="/mock-tests" element={<ProtectedRoute><div className="p-8"><h1 className="text-2xl font-bold">Mock Tests Coming Soon</h1></div></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><div className="p-8"><h1 className="text-2xl font-bold">Settings Coming Soon</h1></div></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
