
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useActiveExam } from '@/hooks/useActiveExam';
import { useDashboardData } from '@/hooks/useDashboardData';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Loader2, TrendingUp, Clock, Target, Percent, Download, ChevronsUpDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { track } from '@/lib/track';

export default function DashboardNew() {
  const navigate = useNavigate();
  const { activeExam, exams, refreshActiveExam, loading: examsLoading } = useActiveExam();
  const { practice, cdna, calibration, reports, loading: dataLoading } = useDashboardData(activeExam ? activeExam.exam_id : null) || {};
  const [isSwitching, setIsSwitching] = useState(false);

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

  const handleSwitchCourse = async (examId: string) => {
    if (examId === activeExam?.exam_id) return;
    setIsSwitching(true);
    try {
      const { error } = await supabase.rpc('ensure_enrolled_and_set_active', { p_exam_id: examId });
      if (error) throw error;
      // The useActiveExam hook will refresh the app state automatically on next load,
      // but for an instant UI update, we can refresh it manually.
      await refreshActiveExam();
    } catch (error) {
      console.error("Error switching course:", error);
    } finally {
      setIsSwitching(false);
    }
  };

  const isLoading = examsLoading || dataLoading || isSwitching;

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full bg-background items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-foreground" />
          <p className="text-foreground font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!activeExam) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-6 lg:p-8 space-y-8 bg-muted/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Welcome back!</h1>
            <p className="text-base text-muted-foreground">
              Studying for <span className="font-semibold text-foreground">{activeExam.name}</span>
              {practice?.streak > 0 && ` • ${practice.streak} day streak`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* NEW: Switch Course Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[150px] justify-between">
                  Switch Course
                  <ChevronsUpDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {exams.map((exam) => (
                  <DropdownMenuItem 
                    key={exam.exam_id} 
                    onClick={() => handleSwitchCourse(exam.exam_id)}
                    disabled={exam.exam_id === activeExam.exam_id}
                  >
                    {exam.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="outline" className="border-primary hover:bg-primary/10 text-primary" onClick={() => navigate('/calibration')}>
              Resume Calibration
            </Button>
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground" onClick={() => navigate('/practice')}>
              Start Practice
            </Button>
            {reports?.weeklyUrl && (
              <Button variant="outline" size="icon" onClick={() => window.open(reports.weeklyUrl, '_blank')}>
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Total Practice</span>
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-4xl font-semibold text-foreground">{practice?.total ?? 0}</h3>
            <p className="text-sm text-muted-foreground mt-2">{practice?.accuracy ?? 0}% accuracy</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Avg Time</span>
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-4xl font-semibold text-foreground">{Math.round((practice?.avgTimeMs ?? 0) / 1000)}s</h3>
            <p className="text-sm text-muted-foreground mt-2">per question</p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Calibration</span>
              <Target className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-4xl font-semibold text-foreground">{calibration?.progress ?? 0}%</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {(calibration?.progress ?? 0) === 100 ? 'Complete' : `${100 - (calibration?.progress ?? 0)}% to go`}
            </p>
          </GlassCard>
          <GlassCard>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">ECE Score</span>
              <Percent className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="text-4xl font-semibold text-foreground">{cdna?.ece !== null ? cdna?.ece?.toFixed(3) : 'N/A'}</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {cdna?.ece !== null && cdna?.ece < 0.1 ? 'Excellent' : 'Lower is better'}
            </p>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}
