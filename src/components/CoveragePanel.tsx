import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export interface CoverageProps {
  series: Array<{ label: string; passed: number; failed: number; notRun: number }>;
  weaknesses: Array<{ 
    concept: string; 
    severity: 'critical' | 'high' | 'medium' | 'low'; 
    acc: number; 
    attempts: number; 
  }>;
  onDrill: (concept: string) => void;
}

export default function CoveragePanel(p: CoverageProps) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-4 text-lg">Coverage & Weaknesses</div>
      <div className="grid md:grid-cols-2 gap-4">
        <div className="text-sm text-muted-foreground flex items-center justify-center border border-border rounded p-4">
          [Bars placeholder]
        </div>
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2">Concept</th>
                <th className="text-center p-2">Acc</th>
                <th className="text-center p-2">Attempts</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {p.weaknesses.map(w => (
                <tr key={w.concept} className="border-t border-border">
                  <td className="p-2">{w.concept}</td>
                  <td className="text-center p-2">{w.acc}%</td>
                  <td className="text-center p-2">{w.attempts}</td>
                  <td className="text-right p-2">
                    <Button 
                      variant="link" 
                      size="sm" 
                      onClick={() => p.onDrill(w.concept)}
                      className="h-auto p-0"
                    >
                      Drill
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
