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

      // Get all calibration items for this exam
      const { data: items } = await supabase
        .from('calibration_items')
        .select('*')
        .eq('exam_id', enrollment.exam_id)
        .order('created_at', { ascending: true });

      if (!items || items.length === 0) {
        toast({
          title: 'No calibration items',
          description: 'Please contact admin to add calibration prompts',
          variant: 'destructive'
        });
        setLoading(false);
        return;
      }

      // Get completed justifications
      const { data: justifications } = await supabase
        .from('user_justifications')
        .select('train_ai_item_id')
        .eq('user_id', user.id)
        .eq('exam_id', enrollment.exam_id);

      const completedCount = justifications?.length || 0;
      const progressPercent = Math.round((completedCount / items.length) * 100);
      setProgress(progressPercent);

      // Find first incomplete item (simplified - just show items in order)
      const incompleteItem = completedCount < items.length ? items[completedCount] : null;
      
      if (incompleteItem) {
        setCurrentItem(incompleteItem);
      } else {
        toast({
          title: 'All items completed!',
          description: 'You have completed all calibration items for this exam'
        });
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

  function addAssumptionChip() {
    if (assumptions.trim()) {
      setAssumptionChips([...assumptionChips, assumptions.trim()]);
      setAssumptions('');
    }
  }

  function removeAssumptionChip(index: number) {
    setAssumptionChips(assumptionChips.filter((_, i) => i !== index));
  }

  function addCustomStrategy() {
    if (customStrategy.trim() && !strategyTags.includes(customStrategy.trim())) {
      setStrategyTags([...strategyTags, customStrategy.trim()]);
      setCustomStrategy('');
    }
  }

  function toggleStrategy(strategy: string) {
    if (strategyTags.includes(strategy)) {
      setStrategyTags(strategyTags.filter(s => s !== strategy));
    } else {
      setStrategyTags([...strategyTags, strategy]);
    }
  }

  function isUrlValid(url: string): boolean {
    if (!url) return true;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isFormValid(): boolean {
    if (!answerText.trim()) return false;
    if (answerText.length < 180) return false;
    if (!perceivedDifficulty) return false;
    if (externalLink && !isUrlValid(externalLink)) return false;
    return true;
  }

  async function handleSubmit() {
    if (!currentItem || !activeExam) return;
    if (!isFormValid()) {
      toast({
        title: 'Validation failed',
        description: 'Please fill all required fields correctly (min 180 chars)',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const latencyMs = Date.now() - startTime;
      const confidenceValue = confidence[0] / 100;

      const resources = {
        calculator: useCalculator,
        notes: notesText || null,
        link: externalLink || null
      };

      // Insert justification with type assertion
      const { error: justificationError } = await supabase
        .from('user_justifications')
        .insert([{
          user_id: user.id,
          exam_id: activeExam.exam_id,
          train_ai_item_id: currentItem.id,
          answer: answerText,
          justification: answerText,
          confidence_0_1: confidenceValue,
          strategy_tags: strategyTags,
          assumptions: assumptionChips as any,
          checks_units: checksUnits || null,
          perceived_difficulty: parseInt(perceivedDifficulty)
        } as any]);

      if (justificationError) throw justificationError;

      // Insert attempt with type assertion
      const { error: attemptError } = await supabase
        .from('attempts')
        .insert([{
          user_id: user.id,
          question_id: currentItem.id,
          correct: null,
          time_taken_ms: latencyMs,
          time_taken: latencyMs / 1000,
          confidence_0_1: confidenceValue,
          strategy_tags: strategyTags,
          assumptions: assumptionChips.join('; '),
          checks: checksUnits,
          resources,
          difficulty: parseInt(perceivedDifficulty),
          final_answer: answerText,
          latency_ms: latencyMs,
          mode: 'calibration'
        } as any]);

      if (attemptError) throw attemptError;

      // Update calibration progress
      const newProgress = Math.min(1, (progress + 10) / 100);
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
        title: 'Saved successfully',
        description: 'Your calibration response has been recorded'
      });

      // Reset form
      setAnswerText('');
      setConfidence([50]);
      setStrategyTags([]);
      setAssumptionChips([]);
      setAssumptions('');
      setChecksUnits('');
      setUseCalculator(false);
      setNotesText('');
      setExternalLink('');
      setPerceivedDifficulty('');

      // Load next item
      await loadCalibrationState();
    } catch (error) {
      console.error('Error submitting:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-lime" />
        </main>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-8">
          <GlassCard className="p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">No Active Exam</h2>
            <p className="text-muted-foreground mb-6">
              You need to select an active exam before starting calibration.
            </p>
            <Button onClick={() => navigate('/settings')}>
              Go to Settings
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }

  if (!currentItem) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-8">
          <GlassCard className="p-12 text-center">
            <h2 className="text-2xl font-semibold mb-4">Calibration Complete!</h2>
            <p className="text-muted-foreground mb-6">
              You have completed all calibration items for this exam.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary">Calibration Lab</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
            <span>Progress: {progress}%</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Prompt */}
          <GlassCard>
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Current Prompt</h2>
              <p className="text-lg leading-relaxed whitespace-pre-wrap">
                {currentItem.prompt}
              </p>
            </div>
          </GlassCard>

          {/* Right: Form */}
          <GlassCard>
            <div className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
              <h2 className="text-xl font-semibold">Your Response</h2>

              {/* Answer */}
              <div>
                <Label htmlFor="answer">Answer & Justification *</Label>
                <Textarea
                  id="answer"
                  value={answerText}
                  onChange={(e) => setAnswerText(e.target.value)}
                  placeholder="Provide your detailed answer and reasoning..."
                  className="min-h-[150px] mt-2"
                  disabled={submitting}
                />
                <div className={`text-sm mt-1 ${answerText.length < 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {answerText.length}/180 minimum characters
                </div>
              </div>

              {/* Confidence */}
              <div>
                <Label>Confidence: {confidence[0]}%</Label>
                <Slider
                  value={confidence}
                  onValueChange={setConfidence}
                  min={0}
                  max={100}
                  step={5}
                  disabled={submitting}
                  className="mt-2"
                />
              </div>

              {/* Strategy Tags */}
              <div>
                <Label>Strategy Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STRATEGY_OPTIONS.map((strategy) => (
                    <Badge
                      key={strategy}
                      variant={strategyTags.includes(strategy) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => !submitting && toggleStrategy(strategy)}
                    >
                      {strategy}
                    </Badge>
                  ))}
                  {strategyTags.filter(t => !STRATEGY_OPTIONS.includes(t)).map((tag) => (
                    <Badge key={tag} variant="default" className="cursor-pointer">
                      {tag}
                      <X 
                        className="ml-1 h-3 w-3" 
                        onClick={() => !submitting && toggleStrategy(tag)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={customStrategy}
                    onChange={(e) => setCustomStrategy(e.target.value)}
                    placeholder="Add custom strategy..."
                    disabled={submitting}
                    onKeyPress={(e) => e.key === 'Enter' && addCustomStrategy()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addCustomStrategy}
                    disabled={submitting || !customStrategy.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Assumptions */}
              <div>
                <Label>Assumptions</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {assumptionChips.map((chip, idx) => (
                    <Badge key={idx} variant="secondary">
                      {chip}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => !submitting && removeAssumptionChip(idx)}
                      />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={assumptions}
                    onChange={(e) => setAssumptions(e.target.value)}
                    placeholder="Add assumption..."
                    disabled={submitting}
                    onKeyPress={(e) => e.key === 'Enter' && addAssumptionChip()}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={addAssumptionChip}
                    disabled={submitting || !assumptions.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Checks & Units */}
              <div>
                <Label htmlFor="checks">Checks / Units / Edge Cases</Label>
                <Textarea
                  id="checks"
                  value={checksUnits}
                  onChange={(e) => setChecksUnits(e.target.value)}
                  placeholder="Dimensional analysis, edge cases, rounding..."
                  className="mt-2"
                  disabled={submitting}
                />
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <Label>Resources Used</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="calculator"
                    checked={useCalculator}
                    onCheckedChange={(checked) => setUseCalculator(checked as boolean)}
                    disabled={submitting}
                  />
                  <Label htmlFor="calculator" className="cursor-pointer">Calculator</Label>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    placeholder="Any notes or references..."
                    disabled={submitting}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="link">External Link</Label>
                  <Input
                    id="link"
                    value={externalLink}
                    onChange={(e) => setExternalLink(e.target.value)}
                    placeholder="https://..."
                    disabled={submitting}
                    className="mt-1"
                  />
                  {externalLink && !isUrlValid(externalLink) && (
                    <p className="text-sm text-destructive mt-1">Invalid URL</p>
                  )}
                </div>
              </div>

              {/* Perceived Difficulty */}
              <div>
                <Label>Perceived Difficulty (1-5) *</Label>
                <RadioGroup
                  value={perceivedDifficulty}
                  onValueChange={setPerceivedDifficulty}
                  className="flex gap-4 mt-2"
                  disabled={submitting}
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={String(level)} id={`diff-${level}`} />
                      <Label htmlFor={`diff-${level}`} className="cursor-pointer">{level}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Submit */}
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid() || submitting}
                className="w-full bg-primary text-white hover:bg-primary/90"
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Response'
                )}
              </Button>
            </div>
          </GlassCard>
        </div>
      </main>
    </div>
  );
}