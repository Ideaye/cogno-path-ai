import SideNav from '@/components/SideNav';
import TopBar from '@/components/TopBar';
import HeroStrip from '@/components/HeroStrip';
import CalibrationPanel from '@/components/CalibrationPanel';
import ReadinessGauge from '@/components/ReadinessGauge';
import CoveragePanel from '@/components/CoveragePanel';
import ConsistencyPanel from '@/components/ConsistencyPanel';
import StrategyInsights from '@/components/StrategyInsights';
import CDNAHealth from '@/components/CDNAHealth';
import ActionCenter from '@/components/ActionCenter';
import { useActiveExam } from '@/hooks/useActiveExam';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useState } from 'react';
import { DateRange } from '@/types/domain';

export default function DashboardNew() {
  const { activeExam, exams } = useActiveExam();
  const { stats, weaknesses } = useDashboardData(activeExam?.exam_id);
  const [range, setRange] = useState<DateRange>({ from: 'Last 7d', to: 'Today' });

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/dashboard" />
      <main className="flex-1 p-6 space-y-6 overflow-y-auto">
        <TopBar
          activeExam={activeExam} 
          exams={exams}
          dateRange={range} 
          notificationsCount={0}
          onExamChange={() => {}} 
          onSearch={() => {}} 
          onDateRangeChange={setRange}
        />
        {activeExam && (
          <>
            <HeroStrip
              activeExam={activeExam}
              userName=""
              gating={{ calibratedPct: 0.33, blocked: true, remaining: 16 }}
              streakDays={stats.streak}
              pendingJustifs={0}
              primaryCta={{ 
                label: 'Start Calibration', 
                onClick: () => location.assign('/calibration') 
              }}
            />

            <div className="grid lg:grid-cols-3 gap-6">
              <CalibrationPanel
                completed={8} 
                remaining={16} 
                pct={0.33}
                blocks={[
                  { key: 'baseline', done: 8, total: 8, onOpen: () => location.assign('/calibration') },
                  { key: 'strategy', done: 0, total: 24, onOpen: () => location.assign('/calibration') },
                  { key: 'pressure', done: 0, total: 6, onOpen: () => location.assign('/calibration') },
                  { key: 'drills', done: 0, total: 8, onOpen: () => location.assign('/practice') },
                ]}
                lastJqs={0.32}
              />
              <ReadinessGauge 
                score={713} 
                suggestions={[
                  { id: 'uptime', label: 'Increase practice uptime', minutes: 10, severity: 'high' },
                  { id: 'outbound', label: 'Do 8 elimination drills', minutes: 15, severity: 'med' },
                ]}
              />
              <CDNAHealth 
                ece={stats.ece ?? undefined} 
                anchorMean={stats.anchorMean ?? undefined} 
                anchorStd={stats.anchorStd ?? undefined} 
                version={stats.cdnaVersion ?? undefined} 
                source={stats.cdnaSource ?? undefined}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <CoveragePanel
                series={[]}
                weaknesses={weaknesses as any}
                onDrill={(c) => location.assign(`/practice?concept=${encodeURIComponent(c)}`)}
              />
              <ConsistencyPanel 
                uptimeByDay={[]} 
                avgTimeSec={210} 
                confidenceBias={0.12} 
                attempts7d={stats.totalPractice}
              />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <StrategyInsights 
                mix={{ elimination: .32, equation_setup: .28, diagram: .18 }} 
                jqsMedian={0.58} 
                last5={[]} 
                queue={{ queued: 0, processing: 0, done24h: 0 }}
              />
              <ActionCenter 
                actions={[
                  { id: 'weekly', label: 'Schedule Weekly Deep-Dive 12', minutes: 2, severity: 'med' }
                ]}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
