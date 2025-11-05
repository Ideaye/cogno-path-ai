tsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveExam } from '@/hooks/useActiveExam';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader2, TrendingUp, Clock, Target, Percent, Download } from 'lucide-react';
import { track } from '@/lib/track';

export default function DashboardNew() {
  const navigate = useNavigate();
  const { activeExam, loading: examsLoading } = useActiveExam();

  // ----------------------------------------------------------------------------------
  // THE FINAL, BULLETPROOF FIX IS HERE: `|| {}`
  // This ensures that even if useDashboardData returns nothing, we have an empty
  // object to work with, preventing the crash.
  // ----------------------------------------------------------------------------------
  const { practice, cdna, calibration, reports, loading: dataLoading } = useDashboardData(activeExam ? activeExam.exam_id : null) || {};

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      if (!examsLoading && !activeExam) {
        navigate('/courses');
      }
    };

    checkAuthAndRedirect();
  }, [navigate, examsLoading, activeExam]);

  // Use the loading state from our hooks. The || false is a safety net.
  const isLoading = examsLoading || dataLoading || false;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-black" />
          <p className="text-black font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!activeExam) {
    // While redirecting to /courses, show nothing.
    return null;
  }

  // If we reach here, it is safe to render.
  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-6 lg:p-8 space-y-8 bg-muted/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-black">
              Welcome back!
            </h1>
            <p className="text-base text-black/80 font-normal">
              Studying for <span className="font-semibold text-black">{activeExam.name}</span>
              {practice?.streak > 0 && ` • ${practice.streak} day streak`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-primary hover:bg-primary/10 text-black"
              onClick={() => {
                track('dashboard.resume_calibration_clicked');
                navigate('/calibration');
              }}
            >
              Resume Calibration
            </Button>
            <Button
              className="bg-primary hover:bg-primary-hover text-black"
              onClick={() => {
                track('dashboard.start_practice_clicked');
                navigate('/practice');
              }}
            >
              Start Practice
            </Button>
            {reports?.weeklyUrl && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => window.open(reports.weeklyUrl, '_blank')}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">Total Practice</span>
              <TrendingUp className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-4xl font-semibold text-black">{practice?.total ?? 0}</h3>
            <p className="text-sm text-black/80 mt-2 font-normal">
              {practice?.accuracy ?? 0}% accuracy
            </p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">Avg Time</span>
              <Clock className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-4xl font-semibold text-black">{Math.round((practice?.avgTimeMs ?? 0) / 1000)}s</h3>
            <p className="text-sm text-black/80 mt-2 font-normal">per question</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">Calibration</span>
              <Target className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-4xl font-semibold text-black">{calibration?.progress ?? 0}%</h3>
            <p className="text-sm text-black/80 mt-2 font-normal">
              {(calibration?.progress ?? 0) === 100 ? 'Complete' : `${100 - (calibration?.progress ?? 0)}% to go`}
            </p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-black">ECE Score</span>
              <Percent className="h-5 w-5 text-black" />
            </div>
            <h3 className="text-4xl font-semibold text-black">{cdna?.ece !== null ? cdna?.ece?.toFixed(3) : 'N/A'}</h3>
            <p className="text-sm text-black/80 mt-2 font-normal">
              {cdna?.ece !== null && cdna?.ece < 0.1 ? 'Excellent' : 'Lower is better'}
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}