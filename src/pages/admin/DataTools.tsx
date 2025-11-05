import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Database, Trash2, Play } from 'lucide-react';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';

export default function DataTools() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [usersCount, setUsersCount] = useState(400);
  const [days, setDays] = useState(30);
  const [attemptsMin, setAttemptsMin] = useState(80);
  const [attemptsMax, setAttemptsMax] = useState(150);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const { data } = await supabase.from('exams').select('*').order('name');
    if (data) {
      setExams(data);
      setSelectedExams(data.map(e => e.id));
    }
  };

  const handleGenerateDataset = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('seed-synthetic-data', {
        body: {
          exam_ids: selectedExams,
          users_count: usersCount,
          days,
          attempts_range: [attemptsMin, attemptsMax],
        },
      });

      if (response.error) throw response.error;

      const counts = response.data?.counts || {};
      toast({
        title: 'Dataset Generated',
        description: `Created ${counts.users} users, ${counts.practice_items} practice items, ${counts.calibration_items} calibration items`,
      });
    } catch (error: any) {
      console.error('Error generating dataset:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate dataset',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWipeData = async () => {
    if (!confirm('This will delete ALL synthetic data. Continue?')) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('wipe-synthetic-data');

      if (response.error) throw response.error;

      const deleted = response.data?.deleted || {};
      toast({
        title: 'Data Wiped',
        description: `Deleted ${deleted.users} users, ${deleted.attempts} attempts, ${deleted.practice_items} practice items`,
      });
    } catch (error: any) {
      console.error('Error wiping data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to wipe data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleExam = (examId: string) => {
    setSelectedExams(prev =>
      prev.includes(examId)
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <CollapsibleSideNav />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Synthetic Data Tools</h1>
            <p className="text-foreground/70">Generate and manage synthetic data for testing and development</p>
          </div>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Database className="h-6 w-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">Generate Dataset</h2>
            </div>

            <div className="space-y-6">
              <div>
                <Label className="text-foreground mb-3 block">Select Exams</Label>
                <div className="grid grid-cols-2 gap-3">
                  {exams.map(exam => (
                    <label key={exam.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedExams.includes(exam.id)}
                        onChange={() => toggleExam(exam.id)}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-foreground/80">{exam.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="users" className="text-foreground">Number of Users</Label>
                  <Input
                    id="users"
                    type="number"
                    value={usersCount}
                    onChange={(e) => setUsersCount(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="days" className="text-foreground">Days of History</Label>
                  <Input
                    id="days"
                    type="number"
                    value={days}
                    onChange={(e) => setDays(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="attempts-min" className="text-foreground">Min Attempts/User</Label>
                  <Input
                    id="attempts-min"
                    type="number"
                    value={attemptsMin}
                    onChange={(e) => setAttemptsMin(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="attempts-max" className="text-foreground">Max Attempts/User</Label>
                  <Input
                    id="attempts-max"
                    type="number"
                    value={attemptsMax}
                    onChange={(e) => setAttemptsMax(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleGenerateDataset}
                disabled={loading || selectedExams.length === 0}
                className="w-full bg-primary hover:bg-primary-hover text-primary-foreground"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Generate Dataset
                  </>
                )}
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <Trash2 className="h-6 w-6 text-destructive" />
              <h2 className="text-2xl font-semibold text-foreground">Wipe Synthetic Data</h2>
            </div>

            <p className="text-foreground/70 mb-4">
              This will delete all synthetic data (users, items, attempts, etc.) while preserving real data.
              This action cannot be undone.
            </p>

            <Button
              onClick={handleWipeData}
              disabled={loading}
              variant="destructive"
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Wiping...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-5 w-5" />
                  Wipe All Synthetic Data
                </>
              )}
            </Button>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}