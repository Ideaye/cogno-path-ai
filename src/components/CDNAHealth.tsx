import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface CdnaHealthProps {
  ece?: number | null; 
  anchorMean?: number | null; 
  anchorStd?: number | null;
  version?: string | null; 
  source?: 'shadow' | 'live' | null;
}

export default function CDNAHealth(p: CdnaHealthProps) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-4 text-lg">CDNA Health</div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">ECE</span>
          <span className="font-semibold">
            {p.ece !== null && p.ece !== undefined ? p.ece.toFixed(3) : '—'}
            <span className="text-xs text-muted-foreground ml-2">(target ≤ 0.08)</span>
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Anchor μ</span>
          <span className="font-semibold">
            {p.anchorMean !== null && p.anchorMean !== undefined ? p.anchorMean.toFixed(3) : '—'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Anchor σ</span>
          <span className="font-semibold">
            {p.anchorStd !== null && p.anchorStd !== undefined ? p.anchorStd.toFixed(3) : '—'}
            <span className="text-xs text-muted-foreground ml-2">(target ≤ 0.12)</span>
          </span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-border">
          <span className="text-muted-foreground">Version</span>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{p.version ?? '—'}</span>
            {p.source && (
              <Badge variant={p.source === 'live' ? 'default' : 'secondary'}>
                {p.source === 'shadow' ? '🔬 Shadow' : '✅ Live'}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
