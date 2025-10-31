import { ActionItem } from '@/types/domain';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ReadinessGauge({ score, suggestions }: { score: number; suggestions: ActionItem[] }) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-3 text-lg">Readiness Score</div>
      <div className="text-4xl font-bold text-primary mb-6">{score}</div>
      <div className="space-y-2">
        {suggestions.map(s => (
          <div 
            key={s.id} 
            className="flex items-center justify-between border border-border rounded p-3 text-sm"
          >
            <div className="flex-1">
              <div className="font-medium">{s.label}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.minutes} min • <Badge variant={s.severity === 'high' ? 'destructive' : 'secondary'} className="text-xs">{s.severity.toUpperCase()}</Badge>
              </div>
            </div>
            <Button size="sm" onClick={() => s.cta?.()}>
              Optimize
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
}
