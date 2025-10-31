import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Target, Percent, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { NotificationDropdown } from '@/components/NotificationDropdown';
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
          <p className="text-muted-foreground">Loading dashboard... ⏳</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 transition-all" style={{ backgroundColor: '#f2f2f2' }}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Welcome back! 👋
            </h1>
            {activeExam && (
              <p className="text-sm sm:text-base text-muted-foreground font-normal">
                Studying for <span className="font-medium text-foreground">{activeExam.name}</span>
                {practice.streak > 0 && ` • 🔥 ${practice.streak} day streak`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <NotificationDropdown />
            {reports.weeklyUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary hover:bg-primary/10 w-full sm:w-auto transition-all"
                onClick={() => window.open(reports.weeklyUrl, '_blank')}
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Download Report</span>
                <span className="sm:hidden">Report</span>
              </Button>
            )}
          </div>
        </div>

        {activeExam ? (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-4 sm:p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">📊 Total Practice</span>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold text-primary">{practice.total}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-normal">
                  {practice.accuracy}% accuracy {practice.accuracy > 75 ? '🌟' : '📈'}
                </p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">⏱️ Avg Time</span>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-soft-purple" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold">{Math.round(practice.avgTimeMs / 1000)}s</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-normal">per question</p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">🎯 Calibration</span>
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-lavender" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold">{calibration.progress}%</h3>
                <p className="text-sm text-muted-foreground mt-2 font-normal">
                  {calibration.progress === 100 ? '✅ Complete' : `${100 - calibration.progress}% to go`}
                </p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 hover:scale-105 transition-transform">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">📈 ECE Score</span>
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold">{cdna.ece !== null ? cdna.ece.toFixed(3) : 'N/A'}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-normal">
                  {cdna.ece !== null && cdna.ece < 0.1 ? '🏆 Excellent' : 'Lower is better'}
                </p>
              </GlassCard>
            </div>

            {/* CDNA Metrics */}
            <GlassCard className="hover:scale-[1.02] transition-transform">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">🧬 CDNA Metrics</h2>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">ECE</p>
                    <p className="text-xl sm:text-2xl font-semibold text-primary">
                      {cdna.ece !== null ? cdna.ece.toFixed(3) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Anchor Mean</p>
                    <p className="text-xl sm:text-2xl font-semibold">
                      {cdna.anchorMean !== null ? cdna.anchorMean.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Anchor Std</p>
                    <p className="text-xl sm:text-2xl font-semibold">
                      {cdna.anchorStd !== null ? cdna.anchorStd.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Recent Activity */}
            <GlassCard className="hover:scale-[1.02] transition-transform">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-semibold mb-4">📅 Recent Activity</h2>
                {practice.recent.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {practice.recent.slice(0, 5).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <span className={item.correct ? 'text-success' : 'text-destructive'}>
                            {item.correct ? '✅' : '❌'}
                          </span>
                          <span className="text-xs sm:text-sm text-muted-foreground font-normal">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm font-medium">{item.id.slice(0, 8)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="font-normal">📚 No recent activity yet</p>
                    <p className="text-sm mt-1 font-normal">Start practicing to see your progress here!</p>
                  </div>
                )}
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary-hover text-white flex-1 transition-all hover:scale-105"
                onClick={() => {
                  track('dashboard.resume_calibration_clicked');
                  navigate('/calibration');
                }}
              >
                🚀 Resume Calibration
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-primary hover:bg-primary/10 flex-1 transition-all hover:scale-105"
                onClick={() => {
                  track('dashboard.start_practice_clicked');
                  navigate('/practice');
                }}
              >
                💪 Start Adaptive Practice
              </Button>
            </div>
          </>
        ) : (
          <GlassCard className="p-8 sm:p-12 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4">📚 No Active Exam Selected</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 font-normal">
              Select an exam from settings to start tracking your progress! 🎯
            </p>
            <Button onClick={() => navigate('/settings')} className="transition-all hover:scale-105">
              Go to Settings
            </Button>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
