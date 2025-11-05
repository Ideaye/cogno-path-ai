
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
      } else {
        setActiveExam(enrollment);
        const { data: items } = await supabase
          .from('calibration_items')
          .select('*')
          .eq('exam_id', enrollment.exam_id)
          .order('created_at', { ascending: true });

        if (!items || items.length === 0) {
          toast({ title: 'No calibration items', description: 'Please contact admin to add calibration prompts', variant: 'destructive' });
          setCurrentItem(null);
        } else {
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

          setCurrentItem(nextItem || null);
          setStartTime(Date.now());
        }
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
    try { new URL(url); return true; } catch { return false; }
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
      if (!user || !currentItem || !activeExam) return;

      const { data: justificationData, error: justificationError } = await supabase
        .from('user_justifications')
        .insert({ /* ... */ })
        .select('id').single();

      if (justificationError) throw justificationError;

      await supabase.from('attempts').insert({ /* ... */ });

      toast({ title: 'Saved successfully' });
      loadCalibrationState();
    } catch (error) {
      toast({ title: 'Error submitting', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-6 space-y-6 bg-muted/20">
        {loading ? (
          <div className="flex items-center justify-center pt-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : !activeExam ? (
          <GlassCard className="p-8 text-center"><h2 className="text-2xl font-semibold mb-4">No Active Exam</h2><Button onClick={() => navigate('/profile')}>Go to Profile</Button></GlassCard>
        ) : !currentItem ? (
          <GlassCard className="p-8 text-center"><h2 className="text-2xl font-semibold mb-4">Calibration Complete!</h2><Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button></GlassCard>
        ) : (
          <>
            <div className="mb-6"><h1 className="text-3xl font-bold">Calibration Lab</h1><div className="flex items-center gap-4 text-sm mt-2"><Progress value={progress} className="max-w-md" /><span>{progress}%</span></div></div>
            <GlassCard><div className="p-6"><h2 className="text-xl font-semibold mb-4">Current Prompt</h2><p className="text-lg leading-relaxed whitespace-pre-wrap">{currentItem.prompt}</p></div></GlassCard>
            <GlassCard><div className="p-6 space-y-8">
              <h2 className="text-xl font-semibold">Your Response</h2>
              {/* RESTORED FORM CONTENT */}
              <div><Label htmlFor="answer">Answer & Justification *</Label><Textarea id="answer" value={answerText} onChange={(e) => setAnswerText(e.target.value)} placeholder="Provide detailed reasoning..." className="min-h-[150px] mt-2" disabled={submitting} /><div className={`text-sm mt-1 ${answerText.length < 180 ? 'text-destructive' : 'text-muted-foreground'}`}>{answerText.length}/180 chars</div></div>
              <div><Label>Confidence: {confidence[0]}% *</Label><Slider value={confidence} onValueChange={setConfidence} min={0} max={100} step={5} disabled={submitting} className="mt-2 max-w-sm" /></div>
              <div><Label>Strategy Tags *</Label><div className="flex flex-wrap gap-2 mt-2">{displayedStrategies.map(s => <Badge key={s} variant={strategyTags.includes(s) ? 'default' : 'outline'} onClick={() => toggleStrategy(s)}>{s}</Badge>)}</div><div className="flex gap-2 mt-3"><Input placeholder="Add custom..." value={customStrategy} onChange={e=>setCustomStrategy(e.target.value)} onKeyDown={e=>e.key==='Enter' && addCustomStrategy()} /><Button variant="outline" size="icon" onClick={addCustomStrategy}><Plus/></Button></div></div>
              <div><Label>Assumptions *</Label><div className="flex flex-wrap gap-2 mt-2 min-h-[40px] p-2 border rounded-md">{assumptionChips.map((c,i)=><Badge key={i} variant="secondary">{c}<X onClick={()=>removeAssumptionChip(i)}/></Badge>)}</div><div className="flex gap-2 mt-2"><Input placeholder="Add assumption..." value={assumptions} onChange={e=>setAssumptions(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addAssumptionChip()}/><Button variant="outline" size="icon" onClick={addAssumptionChip}><Plus/></Button></div></div>
              <div><Label>Perceived Difficulty *</Label><RadioGroup value={perceivedDifficulty} onValueChange={setPerceivedDifficulty} className="flex gap-4 mt-2">{[1,2,3,4,5].map(l=><div key={l}><RadioGroupItem value={`${l}`} id={`d${l}`}/><Label htmlFor={`d${l}`}>{l}</Label></div>)}</RadioGroup></div>
              <div><Label htmlFor="checks">Checks/Units *</Label><Textarea id="checks" value={checksUnits} onChange={e=>setChecksUnits(e.target.value)} placeholder="Dimensional analysis..." disabled={submitting}/>{!checksUnits.trim()&&<p>Required</p>}</div>
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg"><Label>Resources (Optional)</Label><div className="flex items-center space-x-2"><Checkbox id="calc" checked={useCalculator} onCheckedChange={c=>setUseCalculator(!!c)}/><Label htmlFor="calc">Used Calculator</Label></div><div><Textarea value={notesText} onChange={e=>setNotesText(e.target.value)} placeholder="Notes..."/></div><div><Input type="url" value={externalLink} onChange={e=>setExternalLink(e.target.value)} placeholder="https://..."/></div></div>
              <Button onClick={handleSubmit} disabled={!isFormValid()||submitting} size="lg">{submitting?<Loader2 className="animate-spin"/>:'Submit'}</Button>
            </div></GlassCard>
          </>
        )}
      </main>
    </div>
  );
}
