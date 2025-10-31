import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/track';
import SideNav from '@/components/SideNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download } from 'lucide-react';

export default function Profile() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [exams, setExams] = useState<Array<{ exam_id: string; name: string; is_active: boolean }>>([]);
  const [justifications, setJustifications] = useState<Array<{ jqs: number; created_at: string }>>([]);
  const [generatingReport, setGeneratingReport] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Load profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('name,email')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }

    // Load exam enrollments
    const { data: enrollments } = await supabase
      .from('user_exam_enrollments')
      .select('exam_id,is_active,exams(name)')
      .eq('user_id', user.id)
      .order('created_at');

    if (enrollments) {
      setExams(
        enrollments.map((e: any) => ({
          exam_id: e.exam_id,
          name: e.exams?.name ?? 'Unknown',
          is_active: e.is_active,
        }))
      );
    }

    // Load last 10 justification quality scores
    const { data: evals } = await supabase
      .from('eval_adjudications')
      .select('jqs_0_1,created_at,justification_id')
      .order('created_at', { ascending: false })
      .limit(10);

    if (evals) {
      const userJustifs = await Promise.all(
        evals.map(async (e: any) => {
          const { data: j } = await supabase
            .from('user_justifications')
            .select('train_ai_item_id')
            .eq('id', e.justification_id)
            .maybeSingle();
          
          if (!j) return null;

          const { data: item } = await supabase
            .from('train_ai_items')
            .select('session_id')
            .eq('id', j.train_ai_item_id)
            .maybeSingle();

          if (!item) return null;

          const { data: session } = await supabase
            .from('train_ai_sessions')
            .select('user_id')
            .eq('id', item.session_id)
            .maybeSingle();

          if (session?.user_id === user.id) {
            return { jqs: e.jqs_0_1, created_at: e.created_at };
          }
          return null;
        })
      );

      setJustifications(userJustifs.filter((j): j is { jqs: number; created_at: string } => j !== null));
    }

    setLoading(false);
  };

  const updateProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ name })
      .eq('id', user.id);

    toast({ title: 'Profile updated' });
    track('profile.update', { name });
  };

  const setActiveExam = async (exam_id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Deactivate all
    await supabase
      .from('user_exam_enrollments')
      .update({ is_active: false })
      .eq('user_id', user.id);

    // Activate selected
    await supabase
      .from('user_exam_enrollments')
      .update({ is_active: true })
      .eq('user_id', user.id)
      .eq('exam_id', exam_id);

    toast({ title: 'Active exam updated' });
    track('profile.exam.set_active', { exam_id });
    loadProfile();
  };

  const downloadCalibrationReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setGeneratingReport(true);
    track('profile.report.generate_clicked');

    try {
      const { data, error } = await supabase.functions.invoke('generate-weekly-report', {
        body: { user_id: user.id },
      });

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
        toast({ title: 'Report generated successfully' });
      }
    } catch (error) {
      console.error('Error generating report:', error);
      toast({ title: 'Failed to generate report', variant: 'destructive' });
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/profile" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <div>Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/profile" />
      <main className="flex-1 p-6 space-y-6">
        <div className="text-2xl font-semibold">Profile</div>

        <Card className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} disabled />
          </div>
          <Button onClick={updateProfile}>Save Changes</Button>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="text-lg font-medium">Exam Enrollments</div>
          {exams.length === 0 ? (
            <div className="text-muted-foreground">No exams enrolled</div>
          ) : (
            <div className="space-y-2">
              {exams.map((e) => (
                <div key={e.exam_id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-2">
                    <span>{e.name}</span>
                    {e.is_active && <Badge variant="default">Active</Badge>}
                  </div>
                  {!e.is_active && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveExam(e.exam_id)}
                    >
                      Set Active
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-medium">Calibration Timeline</div>
            <Button
              size="sm"
              variant="outline"
              onClick={downloadCalibrationReport}
              disabled={generatingReport}
            >
              <Download className="mr-2 h-4 w-4" />
              {generatingReport ? 'Generating...' : 'Download Report'}
            </Button>
          </div>
          {justifications.length === 0 ? (
            <div className="text-muted-foreground">No calibration data yet</div>
          ) : (
            <div className="space-y-2">
              {justifications.map((j, i) => (
                <div key={i} className="flex items-center justify-between p-2 border-b">
                  <span className="text-sm text-muted-foreground">
                    {new Date(j.created_at).toLocaleDateString()}
                  </span>
                  <Badge variant={j.jqs >= 0.5 ? 'default' : 'secondary'}>
                    JQS: {j.jqs.toFixed(2)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
