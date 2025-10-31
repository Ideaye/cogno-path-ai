import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideNav from '@/components/SideNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

const CALIBRATION_PROMPTS = [
  "Describe your approach to solving complex quantitative problems under time pressure.",
  "Explain how you identify the most efficient strategy when multiple solution paths exist.",
  "What mental models do you use to verify your answers before submitting?",
  "How do you maintain focus and accuracy during extended test sessions?",
  "Describe your process for eliminating incorrect options in multiple-choice questions.",
];

export default function CalibrationNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [justification, setJustification] = useState('');
  const [confidence, setConfidence] = useState([50]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastJQS, setLastJQS] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  useEffect(() => {
    loadCalibrationState();
  }, []);

  async function loadCalibrationState() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get active exam
      const { data: enrollment } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, exams(name)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!enrollment) {
        setActiveExam(null);
        setLoading(false);
        return;
      }

      setActiveExam(enrollment);

      // Get or create active session
      let { data: existingSession } = await supabase
        .from('train_ai_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('block', 'calibration')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingSession) {
        const { data: newSession, error } = await supabase
          .from('train_ai_sessions')
          .insert([{
            user_id: user.id,
            block: 'calibration'
          }])
          .select()
          .single();

        if (error) throw error;
        existingSession = newSession;
      }

      setSession(existingSession);

      // Get items and calculate progress
      const { data: items } = await supabase
        .from('train_ai_items')
        .select(`
          *,
          question_bank(text),
          user_justifications(*)
        `)
        .eq('session_id', existingSession.id)
        .order('created_at', { ascending: true });

      const completedItems = items?.filter(item => 
        Array.isArray(item.user_justifications) && item.user_justifications.length > 0
      ) || [];
      const progressPercent = Math.round((completedItems.length / 24) * 100);
      setProgress(progressPercent);

      // Get last JQS
      if (completedItems.length > 0) {
        const lastCompleted = completedItems[completedItems.length - 1];
        const lastJustif = Array.isArray(lastCompleted.user_justifications) 
          ? lastCompleted.user_justifications[0] 
          : null;
        
        if (lastJustif) {
          const { data: eval_data } = await supabase
            .from('eval_adjudications')
            .select('jqs_0_1')
            .eq('justification_id', lastJustif.id)
            .maybeSingle();
          
          if (eval_data) {
            setLastJQS(Number(eval_data.jqs_0_1));
          }
        }
      }

      // Get or create current item
      const incompleteItem = items?.find(item => 
        !Array.isArray(item.user_justifications) || item.user_justifications.length === 0
      );
      
      if (incompleteItem) {
        setCurrentItem(incompleteItem);
      } else {
        // Create next item - get a random question from question_bank
        const promptIndex = items?.length || 0;
        
        // Get a random question from question_bank for calibration
        const { data: questions } = await supabase
          .from('question_bank')
          .select('id')
          .limit(50);
        
        if (!questions || questions.length === 0) {
          toast({
            title: 'No questions available',
            description: 'Please contact admin to add calibration questions',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }
        
        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        
        const { data: newItem, error } = await supabase
          .from('train_ai_items')
          .insert([{
            session_id: existingSession.id,
            question_id: randomQuestion.id
          }])
          .select(`
            *,
            question_bank(text)
          `)
          .single();

        if (error) throw error;
        setCurrentItem(newItem);
      }

      setStartTime(Date.now());
    } catch (error) {
      console.error('Error loading calibration:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calibration session',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!currentItem || !session) return;
    if (justification.trim().length < 180) {
      toast({
        title: 'Justification too short',
        description: 'Please write at least 180 characters',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timeTaken = Date.now() - startTime;

      // Insert justification
      const { data: justif, error: justifError } = await supabase
        .from('user_justifications')
        .insert({
          train_ai_item_id: currentItem.id,
          user_id: user.id,
          content: justification,
          self_confidence: confidence[0],
          time_taken_ms: timeTaken
        })
        .select()
        .single();

      if (justifError) throw justifError;

      // Evaluate justification
      const evalResponse = await supabase.functions.invoke('evaluate-justification', {
        body: { 
          content: justification, 
          confidence: confidence[0] 
        }
      });

      const jqs = evalResponse.data?.jqs_0_1 || 0.5;

      // Insert evaluation
      await supabase
        .from('eval_adjudications')
        .insert({
          justification_id: justif.id,
          jqs_0_1: jqs
        });

      // Update feature table for calibration progress
      const newProgress = Math.min(1, (progress + (100 / 24)) / 100);
      await supabase
        .from('feature_user_exam_daily')
        .upsert({
          user_id: user.id,
          exam_id: activeExam.exam_id,
          snapshot_date: new Date().toISOString().split('T')[0],
          calibration_progress_0_1: newProgress
        }, {
          onConflict: 'user_id,exam_id,snapshot_date'
        });

      toast({
        title: 'Justification submitted',
        description: `Quality score: ${(jqs * 100).toFixed(0)}%`
      });

      // Reset and load next
      setJustification('');
      setConfidence([50]);
      await loadCalibrationState();
    } catch (error) {
      console.error('Error submitting justification:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit justification',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/calibration" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/calibration" />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>No Active Exam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You need to select an active exam before starting calibration.
              </p>
              <Button onClick={() => navigate('/settings')}>
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/calibration" />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">Calibration Lab</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Progress: {progress}%</span>
            {lastJQS !== null && (
              <span>Last JQS: {(lastJQS * 100).toFixed(0)}%</span>
            )}
          </div>
          <Progress value={progress} className="mt-2" />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Prompt</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                {currentItem?.question_bank?.text || 'Loading question...'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Justification</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Write your detailed reasoning here..."
                  className="min-h-[200px]"
                  disabled={submitting}
                />
                <div className="text-sm text-muted-foreground mt-1">
                  {justification.length}/300 (min 180)
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Confidence: {confidence[0]}%
                </label>
                <Slider
                  value={confidence}
                  onValueChange={setConfidence}
                  min={0}
                  max={100}
                  step={5}
                  disabled={submitting}
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || justification.length < 180}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Justification'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
