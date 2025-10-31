import { supabase } from '@/integrations/supabase/client';
import SideNav from '@/components/SideNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminContentNew() {
  const generate = async () => {
    await supabase.functions.invoke('aif-generate', { 
      body: { exam_id: 'cat', count: 20, difficulty: 'medium' }
    });
  };
  
  const approve = async () => {
    await supabase.functions.invoke('aif-approve', { 
      body: { ids: [], min_quality: 0.7 }
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/admin/content" />
      <main className="flex-1 p-6">
        <div className="text-2xl font-semibold mb-6">Admin – Content Ops</div>
        <Card className="p-6">
          <div className="space-y-3">
            <Button onClick={generate}>Generate Content</Button>
            <Button variant="outline" onClick={approve}>Approve (≥0.7)</Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
