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
          title: '⚠️ No calibration items',
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

      // Get next uncompleted item
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
      toast({
        title: '❌ Error',
        description: 'Failed to load calibration items',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  // Helper functions
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
    if (strategyTags.includes(strategy)) {
      setStrategyTags(strategyTags.filter(s => s !== strategy));
    } else {
      setStrategyTags([...strategyTags, strategy]);
    }
  };

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
      perceivedDifficulty !== '' &&
      (externalLink === '' || isUrlValid(externalLink))
    );
  };

  async function handleSubmit() {
    if (!isFormValid()) {
      toast({
        title: '⚠️ Incomplete Form',
        description: 'Please fill all required fields (marked with *)',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        title: '✅ Saved successfully',
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
        title: '❌ Error',
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
        <main className="flex-1 p-8 flex items-center justify-center" style={{ backgroundColor: '#f2f2f2' }}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-8" style={{ backgroundColor: '#f2f2f2' }}>
          <GlassCard className="p-12 text-center animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">📚 No Active Exam</h2>
            <p className="text-muted-foreground mb-6 font-normal">
              You need to select an active exam before starting calibration 🎯
            </p>
            <Button onClick={() => navigate('/settings')} className="transition-all hover:scale-105">
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
        <main className="flex-1 p-8" style={{ backgroundColor: '#f2f2f2' }}>
          <GlassCard className="p-12 text-center animate-fade-in">
            <h2 className="text-2xl font-semibold mb-4">🎉 Calibration Complete!</h2>
            <p className="text-muted-foreground mb-6 font-normal">
              You have completed all calibration items for this exam. Great job! 🌟
            </p>
            <Button onClick={() => navigate('/dashboard')} className="transition-all hover:scale-105">
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
      <main className="flex-1 p-8 space-y-6" style={{ backgroundColor: '#f2f2f2' }}>
        <div className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-primary">🧪 Calibration Lab</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2 font-normal">
            <span>🎯 Progress: {progress}%</span>
          </div>
          <Progress value={progress} className="mt-2" />
        </div>

        {/* Question Block - Full Width on Top */}
        <GlassCard className="hover:scale-[1.01] transition-transform animate-fade-in">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">💡 Current Prompt</h2>
            <p className="text-lg leading-relaxed whitespace-pre-wrap font-normal">
              {currentItem.prompt}
            </p>
          </div>
        </GlassCard>

        {/* Response Form Block - Full Width Below */}
        <GlassCard className="hover:scale-[1.01] transition-transform animate-fade-in">
          <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold">✍️ Your Response</h2>

            {/* Answer */}
            <div>
              <Label htmlFor="answer" className="font-medium">Answer & Justification *</Label>
              <Textarea
                id="answer"
                value={answerText}
                onChange={(e) => setAnswerText(e.target.value)}
                placeholder="Provide your detailed answer and reasoning..."
                className="min-h-[150px] mt-2 transition-all focus:ring-2 focus:ring-primary/50"
                disabled={submitting}
              />
              <div className={`text-sm mt-1 font-normal ${answerText.length < 180 ? 'text-destructive' : 'text-muted-foreground'}`}>
                {answerText.length}/180 minimum characters
              </div>
            </div>

            {/* Confidence */}
            <div>
              <Label className="font-medium">Confidence: {confidence[0]}% *</Label>
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
              <Label className="font-medium">Strategy Tags *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {STRATEGY_OPTIONS.map((strategy) => (
                  <Badge
                    key={strategy}
                    variant={strategyTags.includes(strategy) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-110"
                    onClick={() => !submitting && toggleStrategy(strategy)}
                  >
                    {strategy}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add custom strategy..."
                  value={customStrategy}
                  onChange={(e) => setCustomStrategy(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustomStrategy()}
                  disabled={submitting}
                  className="transition-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addCustomStrategy}
                  disabled={submitting || !customStrategy.trim()}
                  className="transition-all hover:scale-110"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {strategyTags.length === 0 && (
                <p className="text-sm text-destructive mt-1 font-normal">At least one strategy tag required</p>
              )}
            </div>

            {/* Assumptions */}
            <div>
              <Label className="font-medium">Assumptions *</Label>
              <div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border rounded-md bg-muted/20">
                {assumptionChips.map((chip, idx) => (
                  <Badge key={idx} variant="secondary" className="transition-all hover:scale-110">
                    {chip}
                    <X
                      className="h-3 w-3 ml-1 cursor-pointer"
                      onClick={() => removeAssumptionChip(idx)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add an assumption..."
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addAssumptionChip()}
                  disabled={submitting}
                  className="transition-all"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={addAssumptionChip}
                  disabled={submitting || !assumptions.trim()}
                  className="transition-all hover:scale-110"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {assumptionChips.length === 0 && (
                <p className="text-sm text-destructive mt-1 font-normal">At least one assumption required</p>
              )}
            </div>

            {/* Perceived Difficulty */}
            <div>
              <Label className="font-medium">Perceived Difficulty *</Label>
              <RadioGroup
                value={perceivedDifficulty}
                onValueChange={setPerceivedDifficulty}
                className="flex gap-4 mt-2"
                disabled={submitting}
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="flex items-center space-x-2 transition-all hover:scale-110">
                    <RadioGroupItem value={String(level)} id={`diff-${level}`} />
                    <Label htmlFor={`diff-${level}`} className="cursor-pointer font-normal">
                      {level} {level === 1 ? '😊' : level === 5 ? '😰' : ''}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {!perceivedDifficulty && (
                <p className="text-sm text-destructive mt-1 font-normal">Please select a difficulty level</p>
              )}
            </div>

            {/* Optional: Checks / Units / Edge Cases */}
            <div>
              <Label htmlFor="checks" className="font-medium">Checks / Units / Edge Cases</Label>
              <Textarea
                id="checks"
                value={checksUnits}
                onChange={(e) => setChecksUnits(e.target.value)}
                placeholder="Optional: Document any dimensional analysis, edge cases, rounding..."
                className="min-h-[80px] mt-2 transition-all"
                disabled={submitting}
              />
            </div>

            {/* Optional: Resources */}
            <div className="space-y-3 p-4 bg-muted/20 rounded-lg">
              <Label className="font-medium">Resources (Optional)</Label>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="calculator"
                  checked={useCalculator}
                  onCheckedChange={(checked) => setUseCalculator(!!checked)}
                  disabled={submitting}
                />
                <Label htmlFor="calculator" className="cursor-pointer font-normal">
                  🧮 Used Calculator
                </Label>
              </div>

              <div>
                <Label htmlFor="notes" className="font-normal">Notes</Label>
                <Textarea
                  id="notes"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Any additional notes..."
                  className="min-h-[60px] mt-2 transition-all"
                  disabled={submitting}
                />
              </div>

              <div>
                <Label htmlFor="link" className="font-normal">External Link</Label>
                <Input
                  id="link"
                  type="url"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                  placeholder="https://..."
                  className="mt-2 transition-all"
                  disabled={submitting}
                />
                {externalLink && !isUrlValid(externalLink) && (
                  <p className="text-sm text-destructive mt-1 font-normal">Invalid URL format</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || submitting}
              className="w-full bg-primary hover:bg-primary-hover transition-all hover:scale-105"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                '🚀 Submit Response'
              )}
            </Button>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
