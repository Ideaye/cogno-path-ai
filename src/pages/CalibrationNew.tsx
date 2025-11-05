
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { GlassCard } from '@/components/ui/glass-card';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';

const STRATEGY_OPTIONS = [
  'STP', 'AIDA', 'Funnel', 'A/B Testing', 'Pricing', 'Positioning',
  'Copywriting', 'Geo', 'CRM', 'Retention', 'Diagnostics'
];

export default function CalibrationNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Form state
  const [answerText, setAnswerText] = useState('');
  const [confidence, setConfidence] = useState([50]);
  const [strategyTags, setStrategyTags] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [assumptionChips, setAssumptionChips] = useState<string[]>([]);
  const [checksUnits, setChecksUnits] = useState('');
  const [useCalculator, setUseCalculator] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [perceivedDifficulty, setPerceivedDifficulty] = useState<string>('');

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

      const { data: items } = await supabase
        .from('calibration_items')
        .select('*')
        .eq('exam_id', enrollment.exam_id)
        .order('created_at', { ascending: true });

      if (!items || items.length === 0) {
        toast({ title: 'No calibration items', description: 'Please contact admin to add calibration prompts', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data: justifications } = await supabase
        .from('user_justifications')
        .select('train_ai_item_id')
        .eq('user_id', user.id)
        .eq('exam_id', enrollment.exam_id);

      const completedCount = justifications?.length || 0;
      const progressPercent = Math.round((completedCount / items.length) * 100);
      setProgress(progressPercent);

      const completedIds = justifications?.map(j => j.train_ai_item_id) || [];
      const nextItem = items.find(item => !completedIds.includes(item.id));

      if (nextItem) {
        setCurrentItem(nextItem);
        setStartTime(Date.now());
      } else {
        setCurrentItem(null);
      }
    } catch (error) {
      console.error('Error loading calibration:', error);
      toast({ title: 'Error', description: 'Failed to load calibration items', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  const addAssumptionChip = () => {
    if (assumptions.trim()) {
      setAssumptionChips([...assumptionChips, assumptions.trim()]);
      setAssumptions('');
    }
  };

  const removeAssumptionChip = (index: number) => {
    setAssumptionChips(assumptionChips.filter((_, i) => i !== index));
  };

  const addCustomStrategy = () => {
    if (customStrategy.trim() && !strategyTags.includes(customStrategy.trim())) {
      setStrategyTags([...strategyTags, customStrategy.trim()]);
      setCustomStrategy('');
    }
  };

  const toggleStrategy = (strategy: string) => {
    setStrategyTags(tags => tags.includes(strategy) ? tags.filter(s => s !== strategy) : [...tags, strategy]);
  };

  const displayedStrategies = [
    ...STRATEGY_OPTIONS,
    ...strategyTags.filter(t => !STRATEGY_OPTIONS.includes(t))
  ].filter((v, i, a) => a.indexOf(v) === i);

  const isUrlValid = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const isFormValid = () => {
    return (
      answerText.length >= 180 &&
      strategyTags.length > 0 &&
      assumptionChips.length > 0 &&
      checksUnits.trim() !== '' &&
      perceivedDifficulty !== '' &&
      (externalLink === '' || isUrlValid(externalLink))
    );
  };

  async function handleSubmit() {
    if (!isFormValid()) {
      toast({ title: 'Incomplete Form', description: 'Please fill all required fields (marked with *)', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const latencyMs = Date.now() - startTime;
      const confidenceValue = confidence[0] / 100;
      const resources = { calculator: useCalculator, notes: notesText || null, link: externalLink || null };

      const { data: justificationData, error: justificationError } = await supabase
        .from('user_justifications')
        .insert({
          user_id: user.id,
          exam_id: activeExam.exam_id,
          train_ai_item_id: currentItem.id,
          answer: answerText,
          justification: answerText,
          confidence_0_1: confidenceValue,
          strategy_tags: strategyTags,
          assumptions: assumptionChips,
          checks_units: checksUnits,
          perceived_difficulty_1_5: parseInt(perceivedDifficulty),
        })
        .select('id')
        .single();

      if (justificationError) throw justificationError;
      const justificationId = justificationData?.id;

      const { error: attemptError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          exam_id: activeExam.exam_id,
          calibration_item_id: currentItem.id,
          correct: null,
          time_taken_ms: latencyMs,
          confidence_0_1: confidenceValue,
          strategy_tags: strategyTags,
          assumptions: assumptionChips.join('; '),
          checks: checksUnits,
          resources: resources,
          difficulty: parseInt(perceivedDifficulty),
          final_answer: answerText,
          latency_ms: latencyMs,
          mode: 'calibration',
          justification_id: justificationId,
        });

      if (attemptError) throw attemptError;

      loadCalibrationState();
      toast({ title: 'Saved successfully', description: 'Your calibration response has been recorded' });
    } catch (error) {
      console.error('Error submitting:', error);
      toast({ title: 'Error', description: error instanceof Error ? error.message : 'Failed to submit', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-6 space-y-6 bg-muted/20">
        {loading ? (
          <div className="flex items-center justify-center pt-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !activeExam ? (
          <GlassCard className="p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">No Active Exam</h2>
            <p className="text-muted-foreground mb-6">You need to select an active exam before starting calibration.</p>
            <Button onClick={() => navigate('/profile')}>Go to Profile</Button>
          </GlassCard>
        ) : !currentItem ? (
          <GlassCard className="p-8 text-center animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4 text-foreground">Calibration Complete!</h2>
            <p className="text-muted-foreground mb-6">You have completed all calibration items for this exam. Great job!</p>
            <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
          </GlassCard>
        ) : (
          <>
            <div className="mb-6 animate-fade-in">
              <h1 className="text-3xl font-bold text-foreground">Calibration Lab</h1>
              <div className="flex items-center gap-4 text-sm text-foreground mt-2"><Progress value={progress} className="max-w-md" /><span>{progress}% Complete</span></div>
            </div>

            <GlassCard className="animate-fade-in">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-foreground">Current Prompt</h2>
                <p className="text-lg leading-relaxed whitespace-pre-wrap text-foreground/90">{currentItem.prompt}</p>
              </div>
            </GlassCard>

            <GlassCard className="animate-fade-in">
              <div className="p-6 space-y-8">
                <h2 className="text-xl font-semibold text-foreground">Your Response</h2>
                {/* Form fields go here... */}
              </div>
            </GlassCard>
          </>
        )}
      </main>
    </div>
  );
}
