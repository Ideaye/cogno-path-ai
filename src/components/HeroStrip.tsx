import { ExamRef } from '@/types/domain';
import { track } from '@/lib/track';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface HeroProps {
  userName?: string;
  activeExam: ExamRef;
  gating: { calibratedPct: number; blocked: boolean; remaining: number };
  streakDays: number;
  pendingJustifs: number;
  primaryCta: { label: string; onClick: () => void };
}

export default function HeroStrip(p: HeroProps) {
  return (
    <Card className="p-6 flex items-center justify-between">
      <div>
        <div className="text-xl font-medium">
          Hello{p.userName ? `, ${p.userName}` : ''}! 
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Exam: {p.activeExam.name} • Streak {p.streakDays}d
        </div>
        {p.gating.blocked ? (
          <div className="mt-2 text-amber-600 text-sm font-medium">
            Calibration required: {Math.round(p.gating.calibratedPct * 100)}% • {p.gating.remaining} items left
          </div>
        ) : (
          <div className="mt-2 text-emerald-700 text-sm font-medium">
            You're calibrated. Pending LLM reviews: {p.pendingJustifs}
          </div>
        )}
      </div>
      <Button 
        onClick={() => { 
          p.primaryCta.onClick(); 
          track(p.gating.blocked ? 'cta.calibration_start' : 'cta.practice_start', { exam_id: p.activeExam.exam_id });
        }}
      >
        {p.primaryCta.label}
      </Button>
    </Card>
  );
}
