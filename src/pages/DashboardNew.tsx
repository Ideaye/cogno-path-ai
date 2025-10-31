import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Target, Percent, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { useActiveExam } from '@/hooks/useActiveExam';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DateRange } from '@/types/domain';
import { track } from '@/lib/track';

export default function DashboardNew() {
  const navigate = useNavigate();
  const { activeExam, exams, loading: examsLoading } = useActiveExam();
  const { practice, cdna, calibration, reports, loading: dataLoading } = useDashboardData(activeExam?.exam_id);
  const [range, setRange] = useState<DateRange>({ from: '2025-01-01', to: '2025-01-31' });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      }
    };
    checkAuth();
  }, [navigate]);

  if (examsLoading || dataLoading) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      
      <main className="flex-1 p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">
              Welcome back! <span className="gradient-text">✨</span>
            </h1>
            {activeExam && (
              <p className="text-muted-foreground">
                Studying for <span className="font-medium text-foreground">{activeExam.name}</span>
                {practice.streak > 0 && ` • ${practice.streak} day streak 🔥`}
              </p>
            )}
          </div>
          {reports.weeklyUrl && (
            <Button
              variant="outline"
              className="border-lime hover:bg-lime/10"
              onClick={() => window.open(reports.weeklyUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          )}
        </div>

        {activeExam ? (
          <>
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Total Practice</span>
                  <TrendingUp className="h-5 w-5 text-lime" />
                </div>
                <h3 className="text-4xl font-bold gradient-text">{practice.total}</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  {practice.accuracy}% accuracy
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Avg Time</span>
                  <Clock className="h-5 w-5 text-soft-purple" />
                </div>
                <h3 className="text-4xl font-bold">{Math.round(practice.avgTimeMs / 1000)}s</h3>
                <p className="text-sm text-muted-foreground mt-2">per question</p>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">Calibration</span>
                  <Target className="h-5 w-5 text-lavender" />
                </div>
                <h3 className="text-4xl font-bold">{calibration.progress}%</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  calibration progress
                </p>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-muted-foreground">ECE Score</span>
                  <Percent className="h-5 w-5 text-lime" />
                </div>
                <h3 className="text-4xl font-bold">{cdna.ece !== null ? cdna.ece.toFixed(3) : 'N/A'}</h3>
                <p className="text-sm text-muted-foreground mt-2">calibration error</p>
              </GlassCard>
            </div>

            {/* CDNA Metrics */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-4">CDNA Metrics</h2>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">ECE</p>
                    <p className="text-2xl font-bold gradient-text">
                      {cdna.ece !== null ? cdna.ece.toFixed(3) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Anchor Mean</p>
                    <p className="text-2xl font-bold">
                      {cdna.anchorMean !== null ? cdna.anchorMean.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Anchor Std</p>
                    <p className="text-2xl font-bold">
                      {cdna.anchorStd !== null ? cdna.anchorStd.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard>
              <div className="p-6">
                <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {practice.recent.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center gap-3">
                        <span className={item.correct ? 'text-lime' : 'text-destructive'}>
                          {item.correct ? '✓' : '✗'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-sm">{item.id.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                size="lg"
                className="gradient-lime-purple text-white flex-1"
                onClick={() => {
                  track('dashboard.resume_calibration_clicked');
                  navigate('/calibration');
                }}
              >
                Resume Calibration
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-lime flex-1"
                onClick={() => {
                  track('dashboard.start_practice_clicked');
                  navigate('/practice');
                }}
              >
                Start Adaptive Practice
              </Button>
            </div>
          </>
        ) : (
          <GlassCard className="p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">No Active Exam Selected</h2>
            <p className="text-muted-foreground mb-6">
              Select an exam from settings to start tracking your progress
            </p>
            <Button onClick={() => navigate('/settings')}>Go to Settings</Button>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
