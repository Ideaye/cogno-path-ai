import { Card } from '@/components/ui/card';

export interface ConsistencyProps {
  uptimeByDay: Array<{ day: string; minutes: number }>;
  avgTimeSec: number;
  confidenceBias: number;
  attempts7d: number;
}

export default function ConsistencyPanel(p: ConsistencyProps) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-4 text-lg">Consistency & Pace</div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">Avg Time</div>
          <div className="text-xl font-semibold mt-1">
            {(p.avgTimeSec / 60).toFixed(1)} min
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">Confidence Bias</div>
          <div className="text-xl font-semibold mt-1">
            {p.confidenceBias.toFixed(2)}
          </div>
        </div>
        <div className="col-span-2 border border-border rounded p-4 text-muted-foreground text-center">
          [Sparkline placeholder for last 30 days]
        </div>
      </div>
    </Card>
  );
}
