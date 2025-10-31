import { Card } from '@/components/ui/card';

export interface StrategyInsightsProps {
  mix: Record<string, number>;
  jqsMedian?: number;
  last5: Array<{ id: string; jqs: number; created_at: string }>;
  queue: { queued: number; processing: number; done24h: number };
}

export default function StrategyInsights(p: StrategyInsightsProps) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-4 text-lg">Strategy & Justification</div>
      <div className="space-y-3">
        <div>
          <div className="text-xs text-muted-foreground">Median JQS</div>
          <div className="text-2xl font-semibold mt-1">
            {p.jqsMedian?.toFixed(2) ?? '—'}
          </div>
        </div>
        <div className="text-xs text-muted-foreground border-t border-border pt-3">
          Queue: {p.queue.queued} queued • {p.queue.processing} processing • {p.queue.done24h} done/24h
        </div>
      </div>
    </Card>
  );
}
