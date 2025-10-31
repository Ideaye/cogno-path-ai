import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface CalibrationPanelProps {
  completed: number; 
  remaining: number; 
  pct: number;
  blocks: Array<{ 
    key: 'baseline' | 'strategy' | 'pressure' | 'drills'; 
    done: number; 
    total: number; 
    onOpen: () => void 
  }>;
  lastJqs?: number;
}

export default function CalibrationPanel(p: CalibrationPanelProps) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-3 text-lg">Calibration Status</div>
      <div className="text-3xl font-bold">
        {Math.round(p.pct * 100)}%{' '}
        <span className="text-base font-normal text-muted-foreground">
          ({p.completed}/{p.completed + p.remaining})
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4">
        {p.blocks.map(b => (
          <Button
            key={b.key}
            variant="outline"
            className="h-auto flex-col items-start p-3"
            onClick={b.onOpen}
          >
            <div className="text-xs text-muted-foreground capitalize">{b.key}</div>
            <div className="font-semibold text-lg mt-1">
              {b.done}/{b.total}
            </div>
          </Button>
        ))}
      </div>
      {p.lastJqs !== undefined && p.lastJqs < 0.35 && (
        <div className="mt-4 text-xs text-destructive bg-destructive/10 p-2 rounded">
          Last justification quality low (JQS {p.lastJqs.toFixed(2)}). Provide 180+ chars with step-by-step reasoning.
        </div>
      )}
    </Card>
  );
}
