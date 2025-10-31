import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/track';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Download, Loader2 } from 'lucide-react';

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
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-8 space-y-6">
        <h1 className="text-4xl font-bold text-foreground">Profile</h1>

        <GlassCard>
          <div className="p-6 space-y-4">
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
            <Button className="bg-primary hover:bg-primary-hover text-foreground" onClick={updateProfile}>Save Changes</Button>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-6 space-y-4">
            <h2 className="text-xl font-semibold">Exam Enrollments</h2>
            {exams.length === 0 ? (
              <div className="text-muted-foreground">No exams enrolled</div>
            ) : (
              <div className="space-y-2">
                {exams.map((e) => (
                  <div key={e.exam_id} className="flex items-center justify-between p-3 border rounded-xl">
                    <span>{e.name}</span>
                    {e.is_active ? (
                      <Badge className="bg-primary text-foreground">Active</Badge>
                    ) : (
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
          </div>
        </GlassCard>

        <GlassCard>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Calibration Timeline</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadCalibrationReport}
                disabled={generatingReport}
                className="border-primary hover:bg-primary/10"
              >
                <Download className="h-4 w-4 mr-2" />
                {generatingReport ? 'Generating...' : 'Download Report'}
              </Button>
            </div>
            {justifications.length === 0 ? (
              <div className="text-muted-foreground">No calibration data yet</div>
            ) : (
              <div className="space-y-2">
                {justifications.map((j, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      {new Date(j.created_at).toLocaleDateString()}
                    </span>
                    <Badge variant="outline">JQS: {j.jqs.toFixed(2)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
