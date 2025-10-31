import SideNav from '@/components/SideNav';
import TopBar from '@/components/TopBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useActiveExam } from '@/hooks/useActiveExam';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useState } from 'react';
import { DateRange } from '@/types/domain';
import { track } from '@/lib/track';
import { Download, TrendingUp, Clock, Target } from 'lucide-react';

export default function DashboardNew() {
  const { activeExam, exams } = useActiveExam();
  const dashboardData = useDashboardData(activeExam?.exam_id);
  const [range, setRange] = useState<DateRange>({ from: 'Last 7d', to: 'Today' });

  if (dashboardData.loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/dashboard" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div className="text-muted-foreground">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  const { practice, cdna, calibration, reports } = dashboardData;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/dashboard" />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            {activeExam && (
              <p className="text-muted-foreground mt-1">
                {activeExam.name} • Streak {practice.streak}d
              </p>
            )}
          </div>
          {reports.weeklyUrl && (
            <Button
              variant="outline"
              onClick={() => {
                window.open(reports.weeklyUrl!, '_blank');
                track('dashboard.report.download_clicked');
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </Button>
          )}
        </div>

        {activeExam ? (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Total Practice</div>
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div className="text-3xl font-bold mt-2">{practice.total}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {practice.accuracy}% accuracy
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Avg Time</div>
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(practice.avgTimeMs / 1000)}s
                </div>
                <div className="text-sm text-muted-foreground mt-1">per question</div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Calibration</div>
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <div className="text-3xl font-bold mt-2">
                  {Math.round(calibration.progress * 100)}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">progress</div>
              </Card>

              <Card className="p-6">
                <div className="text-sm text-muted-foreground">ECE</div>
                <div className="text-3xl font-bold mt-2">
                  {cdna.ece !== null ? cdna.ece.toFixed(3) : '—'}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {cdna.version ?? 'No version'}
                </div>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <div className="text-lg font-medium mb-4">CDNA Metrics</div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anchor Mean</span>
                    <span className="font-medium">
                      {cdna.anchorMean !== null ? cdna.anchorMean.toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Anchor Std</span>
                    <span className="font-medium">
                      {cdna.anchorStd !== null ? cdna.anchorStd.toFixed(2) : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Source</span>
                    <span className="font-medium capitalize">
                      {cdna.source ?? '—'}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="text-lg font-medium mb-4">Recent Activity</div>
                {practice.recent.length === 0 ? (
                  <div className="text-muted-foreground">No recent attempts</div>
                ) : (
                  <div className="space-y-2">
                    {practice.recent.slice(0, 5).map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between p-2 border-b"
                      >
                        <span className="text-sm">
                          {new Date(att.created_at).toLocaleTimeString()}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            att.correct ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {att.correct ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={() => {
                    location.assign('/calibration');
                    track('dashboard_cta_resume_calibration');
                  }}
                >
                  {calibration.progress < 1
                    ? 'Resume Calibration'
                    : 'Review Calibration'}
                </Button>
              </Card>

              <Card className="p-6">
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    location.assign('/practice?mode=adaptive&time=20');
                    track('dashboard_cta_start_adaptive');
                  }}
                >
                  Start Adaptive Practice
                </Button>
              </Card>
            </div>
          </>
        ) : (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              No active exam. Please select or enroll in an exam from Settings.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
}
