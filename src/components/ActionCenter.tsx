import { ActionItem } from '@/types/domain';
import { track } from '@/lib/track';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function ActionCenter({ actions }: { actions: ActionItem[] }) {
  return (
    <Card className="p-6">
      <div className="font-medium mb-4 text-lg">Next Actions</div>
      <div className="space-y-2">
        {actions.map(a => (
          <Button
            key={a.id}
            variant="outline"
            className="w-full h-auto flex-col items-start p-4"
            onClick={() => { 
              a.cta?.(); 
              track('action.click', { id: a.id });
            }}
          >
            <div className="font-medium text-left w-full">{a.label}</div>
            <div className="flex gap-2 mt-2 text-xs w-full">
              <span className="text-muted-foreground">{a.minutes} min</span>
              <Badge variant={a.severity === 'high' ? 'destructive' : 'secondary'}>
                {a.severity.toUpperCase()}
              </Badge>
            </div>
          </Button>
        ))}
      </div>
    </Card>
  );
}
