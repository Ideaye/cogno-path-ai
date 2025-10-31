import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Clock, Target, Percent, Download, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useActiveExam } from '@/hooks/useActiveExam';
import { useDashboardData } from '@/hooks/useDashboardData';
import { DateRange } from '@/types/domain';
import { track } from '@/lib/track';
import { cn } from '@/lib/utils';

export default function DashboardNew() {
  const navigate = useNavigate();
  const { activeExam, exams, loading: examsLoading } = useActiveExam();
  const { practice, cdna, calibration, reports, loading: dataLoading } = useDashboardData(activeExam?.exam_id);
  const [range, setRange] = useState<DateRange>({ from: '2025-01-01', to: '2025-01-31' });
  const [showCDNA, setShowCDNA] = useState(false);

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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 transition-all" style={{ backgroundColor: '#f2f2f2' }}>
          <div className="text-center py-8 text-foreground">
            <p className="font-normal">Loading dashboard...</p>
          </div>
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
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
              Welcome back!
            </h1>
            {activeExam && (
              <p className="text-sm sm:text-base text-muted-foreground font-normal">
                Studying for <span className="font-medium text-foreground">{activeExam.name}</span>
                {practice.streak > 0 && ` • ${practice.streak} day streak`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Action buttons */}
            <Button
              size="sm"
              variant="outline"
              className="border-primary hover:bg-primary/10 text-foreground transition-all"
              onClick={() => {
                track('dashboard.resume_calibration_clicked');
                navigate('/calibration');
              }}
            >
              Resume Calibration
            </Button>
            <Button
              size="sm"
              className="bg-primary hover:bg-primary-hover text-foreground transition-all"
              onClick={() => {
                track('dashboard.start_practice_clicked');
                navigate('/practice');
              }}
            >
              Start Practice
            </Button>
            
            {/* Download report */}
            {reports.weeklyUrl && (
              <Button
                variant="outline"
                size="sm"
                className="border-primary hover:bg-primary/10 transition-all"
                onClick={() => window.open(reports.weeklyUrl, '_blank')}
              >
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Report</span>
              </Button>
            )}
          </div>
        </div>

        {activeExam ? (
          <>
            {/* Stats Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-2 lg:grid-cols-4">
              <GlassCard className="p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Total Practice</span>
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold text-foreground">{practice.total}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-normal">
                  {practice.accuracy}% accuracy
                </p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Avg Time</span>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold text-foreground">{Math.round(practice.avgTimeMs / 1000)}s</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-normal">per question</p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">Calibration</span>
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold text-foreground">{calibration.progress}%</h3>
                <p className="text-sm text-muted-foreground mt-2 font-normal">
                  {calibration.progress === 100 ? 'Complete' : `${100 - calibration.progress}% to go`}
                </p>
              </GlassCard>

              <GlassCard className="p-4 sm:p-6 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground">ECE Score</span>
                  <Percent className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                </div>
                <h3 className="text-2xl sm:text-4xl font-semibold text-foreground">{cdna.ece !== null ? cdna.ece.toFixed(3) : 'N/A'}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-2 font-normal">
                  {cdna.ece !== null && cdna.ece < 0.1 ? 'Excellent' : 'Lower is better'}
                </p>
              </GlassCard>
            </div>

            {/* CDNA Metrics - Collapsible */}
            <GlassCard className="hover:shadow-md transition-all">
              <Collapsible open={showCDNA} onOpenChange={setShowCDNA}>
                <div className="p-4 sm:p-6">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 hover:bg-transparent mb-4">
                      <h2 className="text-xl sm:text-2xl font-semibold text-foreground">CDNA Metrics</h2>
                      <ChevronDown className={cn("h-5 w-5 transition-transform text-foreground", showCDNA && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">ECE</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">
                          {cdna.ece !== null ? cdna.ece.toFixed(3) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Anchor Mean</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">
                          {cdna.anchorMean !== null ? cdna.anchorMean.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Anchor Std</p>
                        <p className="text-xl sm:text-2xl font-semibold text-foreground">
                          {cdna.anchorStd !== null ? cdna.anchorStd.toFixed(2) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </GlassCard>
          </>
        ) : (
          <GlassCard className="p-8 sm:p-12 text-center">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-foreground">No Active Exam Selected</h2>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 font-normal">
              Select an exam from settings to start tracking your progress!
            </p>
            <Button onClick={() => navigate('/settings')} className="transition-all hover:scale-105 font-medium">
              Go to Settings
            </Button>
          </GlassCard>
        )}
      </main>
    </div>
  );
}
