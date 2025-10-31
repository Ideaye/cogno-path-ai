import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideNav from '@/components/SideNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Loader2, X, Plus } from 'lucide-react';
import { CalibrationPayload } from '@/types/domain';

const STRATEGY_OPTIONS = [
  "Pattern Hunt",
  "Break-Down",
  "Algebraic Setup",
  "Unit Analysis",
  "Visualization",
  "Guess & Check",
  "Elimination",
  "Heuristic",
  "Other"
];

export default function CalibrationNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastJQS, setLastJQS] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Form state
  const [finalAnswer, setFinalAnswer] = useState('');
  const [justification, setJustification] = useState('');
  const [confidence, setConfidence] = useState([50]);
  const [strategyTags, setStrategyTags] = useState<string[]>([]);
  const [customStrategy, setCustomStrategy] = useState('');
  const [assumptions, setAssumptions] = useState('');
  const [assumptionChips, setAssumptionChips] = useState<string[]>([]);
  const [checks, setChecks] = useState('');
  const [useCalculator, setUseCalculator] = useState(false);
  const [usedNotes, setUsedNotes] = useState(false);
  const [useExternalLink, setUseExternalLink] = useState(false);
  const [externalUrl, setExternalUrl] = useState('');
  const [difficulty, setDifficulty] = useState<string>('');

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
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function isFormValid(): boolean {
    if (!finalAnswer.trim()) return false;
    if (justification.length < 180) return false;
    if (!difficulty) return false;
    if (useExternalLink && !isUrlValid(externalUrl)) return false;
    return true;
  }

  async function handleSubmit() {
    if (!currentItem || !session || !activeExam) return;
    if (!isFormValid()) {
      toast({
        title: 'Validation failed',
        description: 'Please fill all required fields correctly',
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

      // Auto-append "Guess & Check" if confidence < 40%
      let finalStrategyTags = [...strategyTags];
      if (confidenceValue < 0.4 && !finalStrategyTags.includes('Guess & Check')) {
        finalStrategyTags.push('Guess & Check');
      }

      const payload: CalibrationPayload = {
        exam_id: activeExam.exam_id,
        train_ai_item_id: currentItem.id,
        final_answer: finalAnswer,
        justification: justification,
        confidence_0_1: confidenceValue,
        strategy_tags: finalStrategyTags,
        assumptions: assumptionChips.join('; '),
        checks: checks,
        resources: {
          calculator: useCalculator,
          notes: usedNotes,
          external_link: useExternalLink ? externalUrl : null
        },
        difficulty: parseInt(difficulty),
        latency_ms: latencyMs,
        is_correct: null // We don't have answer key validation yet
      };

      const { data, error } = await supabase.rpc('create_calibration_attempt', {
        p_exam_id: payload.exam_id,
        p_train_ai_item_id: payload.train_ai_item_id,
        p_final_answer: payload.final_answer,
        p_justification: payload.justification,
        p_confidence_0_1: payload.confidence_0_1,
        p_strategy_tags: payload.strategy_tags,
        p_assumptions: payload.assumptions,
        p_checks: payload.checks,
        p_resources: payload.resources,
        p_difficulty: payload.difficulty,
        p_latency_ms: payload.latency_ms,
        p_is_correct: payload.is_correct
      });

      if (error) throw error;

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
        title: 'Saved successfully',
        description: 'Your calibration response has been recorded'
      });

      // Reset form
      setFinalAnswer('');
      setJustification('');
      setConfidence([50]);
      setStrategyTags([]);
      setAssumptionChips([]);
      setAssumptions('');
      setChecks('');
      setUseCalculator(false);
      setUsedNotes(false);
      setUseExternalLink(false);
      setExternalUrl('');
      setDifficulty('');

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
              <CardTitle>Your Response</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Final Answer */}
              <div>
                <Label htmlFor="final-answer">Final Answer *</Label>
                <Input
                  id="final-answer"
                  value={finalAnswer}
                  onChange={(e) => setFinalAnswer(e.target.value)}
                  placeholder="Enter your final answer"
                  disabled={submitting}
                />
              </div>

              {/* Justification */}
              <div>
                <Label htmlFor="justification">Justification *</Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain your reasoning in detail..."
                  className="min-h-[120px]"
                  disabled={submitting}
                />
                <div className={`text-sm mt-1 ${justification.length < 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {justification.length}/180 minimum characters
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

              {/* Assumptions / Givens */}
              <div>
                <Label>Assumptions / Givens</Label>
                <div className="flex flex-wrap gap-2 mt-2">
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
                <div className="flex gap-2 mt-2">
                  <Input
                    value={assumptions}
                    onChange={(e) => setAssumptions(e.target.value)}
                    placeholder="Add an assumption..."
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
                <Label htmlFor="checks">Checks & Units</Label>
                <Input
                  id="checks"
                  value={checks}
                  onChange={(e) => setChecks(e.target.value)}
                  placeholder="e.g., Units consistent; tested n=1 edge case"
                  disabled={submitting}
                />
              </div>

              {/* Resources Used */}
              <div>
                <Label>Resources Used</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="calculator"
                      checked={useCalculator}
                      onCheckedChange={(checked) => setUseCalculator(checked as boolean)}
                      disabled={submitting}
                    />
                    <Label htmlFor="calculator" className="font-normal cursor-pointer">
                      Calculator
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="notes"
                      checked={usedNotes}
                      onCheckedChange={(checked) => setUsedNotes(checked as boolean)}
                      disabled={submitting}
                    />
                    <Label htmlFor="notes" className="font-normal cursor-pointer">
                      Notes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="external-link"
                      checked={useExternalLink}
                      onCheckedChange={(checked) => setUseExternalLink(checked as boolean)}
                      disabled={submitting}
                    />
                    <Label htmlFor="external-link" className="font-normal cursor-pointer">
                      External Link
                    </Label>
                  </div>
                  {useExternalLink && (
                    <Input
                      value={externalUrl}
                      onChange={(e) => setExternalUrl(e.target.value)}
                      placeholder="https://..."
                      disabled={submitting}
                      className={!isUrlValid(externalUrl) && externalUrl ? 'border-destructive' : ''}
                    />
                  )}
                </div>
              </div>

              {/* Perceived Difficulty */}
              <div>
                <Label>Perceived Difficulty *</Label>
                <RadioGroup
                  value={difficulty}
                  onValueChange={setDifficulty}
                  disabled={submitting}
                  className="flex gap-4 mt-2"
                >
                  {[1, 2, 3, 4, 5].map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <RadioGroupItem value={level.toString()} id={`diff-${level}`} />
                      <Label htmlFor={`diff-${level}`} className="font-normal cursor-pointer">
                        {level}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || !isFormValid()}
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
