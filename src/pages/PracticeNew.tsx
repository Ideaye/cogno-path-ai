import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface Question {
  id: string;
  stem: string;
  options: Array<{ key: string; text: string }>;
  correct_key: string;
  difficulty: number;
}

export default function PracticeNew() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  
  // Session stats
  const [questionCount, setQuestionCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [userSkill, setUserSkill] = useState(500);

  useEffect(() => {
    loadPracticeState();
  }, []);

  async function loadPracticeState() {
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
      await loadNextQuestion(enrollment.exam_id);
    } catch (error) {
      console.error('Error loading practice:', error);
      toast({
        title: 'Error',
        description: 'Failed to load practice session',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadNextQuestion(examId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Call adaptive-select-next edge function
      const { data, error } = await supabase.functions.invoke('adaptive-select-next', {
        body: { user_id: user.id, mode: 'practice' }
      });

      if (error) throw error;
      if (!data || !data.question) {
        toast({
          title: 'No questions available',
          description: 'Unable to load next question',
          variant: 'destructive'
        });
        return;
      }

      const q = data.question;
      
      // Transform to our format
      const optionsArray: Array<{ key: string; text: string }> = [];
      
      if (q.options && typeof q.options === 'object') {
        Object.entries(q.options).forEach(([key, text]) => {
          optionsArray.push({ key, text: text as string });
        });
      }

      const transformedQuestion: Question = {
        id: q.id,
        stem: q.text || 'Question text',
        options: optionsArray,
        correct_key: q.correct_option || '',
        difficulty: (q.difficulty || 0.5) * 1000
      };
      
      setCurrentQuestion(transformedQuestion);
      setSelectedKey('');
      setStartTime(Date.now());
    } catch (error) {
      console.error('Error loading question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load question',
        variant: 'destructive'
      });
    }
  }

  async function handleSubmit() {
    if (!currentQuestion || !selectedKey || !activeExam) return;

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const timeTaken = Date.now() - startTime;
      const correct = selectedKey === currentQuestion.correct_key || currentQuestion.correct_key === '';

      // Insert attempt with type assertion
      const { error: attemptError } = await supabase
        .from('attempts')
        .insert([{
          user_id: user.id,
          question_id: currentQuestion.id,
          correct: currentQuestion.correct_key ? correct : null,
          time_taken_ms: timeTaken,
          time_taken: timeTaken / 1000
        } as any]);

      if (attemptError) throw attemptError;

      // Call record-reward edge function
      try {
        await supabase.functions.invoke('record-reward', {
          body: {
            attempt_id: attemptError, // Will be the inserted ID
            correctness: correct ? 1 : 0,
            time_taken_ms: timeTaken,
            confidence_0_1: 0.5
          }
        });
      } catch (rewardError) {
        console.error('Failed to record reward:', rewardError);
      }

      // Update session stats
      setQuestionCount(prev => prev + 1);
      if (correct && currentQuestion.correct_key) {
        setCorrectCount(prev => prev + 1);
        setUserSkill(prev => Math.min(800, prev + 20));
      } else if (currentQuestion.correct_key) {
        setUserSkill(prev => Math.max(200, prev - 20));
      }
      setTotalTime(prev => prev + timeTaken);

      toast({
        title: currentQuestion.correct_key ? (correct ? '✓ Correct!' : '✗ Incorrect') : '✓ Submitted',
        description: `Time: ${(timeTaken / 1000).toFixed(1)}s`,
        variant: correct || !currentQuestion.correct_key ? 'default' : 'destructive'
      });

      // Load next question
      await loadNextQuestion(activeExam.exam_id);
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit answer',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleEndSession() {
    toast({
      title: 'Session ended',
      description: `Answered ${questionCount} questions with ${Math.round((correctCount / questionCount) * 100)}% accuracy`
    });
    navigate('/dashboard');
  }

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-6">
          <GlassCard className="p-8 text-center">
            <h2 className="text-2xl font-semibold mb-4 text-black">No Active Exam</h2>
            <p className="text-black mb-6">
              You need to select an active exam before starting practice.
            </p>
            <Button onClick={() => navigate('/settings')}>
              Go to Settings
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  const accuracy = questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0;
  const avgTime = questionCount > 0 ? Math.round(totalTime / questionCount / 1000) : 0;

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-6">
        {/* Stats header */}
        <GlassCard className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm">
              <span className="font-medium">Question: <span className="text-primary">{questionCount + 1}</span></span>
              <span className="font-medium">Accuracy: <span className="text-primary">{accuracy}%</span></span>
              <span className="font-medium">Avg Time: <span className="text-primary">{avgTime}s</span></span>
            </div>
            <Button 
              variant="outline" 
              onClick={handleEndSession}
              className="border-primary hover:bg-primary/10"
            >
              End Session
            </Button>
          </div>
        </GlassCard>

        {/* Question card */}
        <GlassCard className="max-w-3xl mx-auto">
          <div className="p-6 space-y-6">
            <h2 className="text-2xl font-semibold">Question {questionCount + 1}</h2>
            
            <div className="text-lg whitespace-pre-wrap leading-relaxed text-black">
              {currentQuestion.stem}
            </div>

            {currentQuestion.options.length > 0 ? (
              <RadioGroup value={selectedKey} onValueChange={setSelectedKey}>
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <div 
                      key={option.key} 
                      className="flex items-center space-x-3 border-2 border-border rounded-xl p-4 hover:border-primary hover:bg-primary/10 cursor-pointer transition-all"
                    >
                      <RadioGroupItem 
                        value={option.key} 
                        id={option.key}
                        disabled={submitting}
                        className="border-primary text-primary"
                      />
                      <Label 
                        htmlFor={option.key} 
                        className="flex-1 cursor-pointer text-foreground"
                      >
                        <span className="font-semibold mr-2 text-primary">{option.key}.</span>
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            ) : (
              <div>
                <Label htmlFor="answer-input">Your Answer *</Label>
                <Textarea
                  id="answer-input"
                  value={selectedKey}
                  onChange={(e) => setSelectedKey(e.target.value)}
                  placeholder="Enter your answer here..."
                  className="mt-2 min-h-[100px]"
                  disabled={submitting}
                />
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={!selectedKey || submitting}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Answer'
              )}
            </Button>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}