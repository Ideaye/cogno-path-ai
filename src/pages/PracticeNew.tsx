import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SideNav from '@/components/SideNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
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
      // Get questions from question_bank (using difficulty as numeric 0-1)
      const { data: questions } = await supabase
        .from('question_bank')
        .select('*')
        .limit(20);

      if (!questions || questions.length === 0) {
        toast({
          title: 'No questions available',
          description: 'Please contact admin to add practice questions',
          variant: 'destructive'
        });
        return;
      }

      // Pick a random question
      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      
      // Transform to our format
      const optionsArray: Array<{ key: string; text: string }> = [];
      
      if (Array.isArray(randomQuestion.options)) {
        // If it's already an array
        for (const opt of randomQuestion.options) {
          if (typeof opt === 'object' && opt !== null && 'key' in opt && 'text' in opt) {
            optionsArray.push({ key: String(opt.key), text: String(opt.text) });
          }
        }
      } else if (typeof randomQuestion.options === 'object' && randomQuestion.options !== null) {
        // If it's an object, convert to array
        Object.entries(randomQuestion.options).forEach(([key, text]) => {
          optionsArray.push({ key, text: String(text) });
        });
      }

      const transformedQuestion: Question = {
        id: randomQuestion.id,
        stem: randomQuestion.text || 'Question text',
        options: optionsArray.length > 0 ? optionsArray : [
          { key: 'A', text: 'Option A' },
          { key: 'B', text: 'Option B' },
          { key: 'C', text: 'Option C' },
          { key: 'D', text: 'Option D' }
        ],
        correct_key: randomQuestion.correct_option || 'A',
        difficulty: (randomQuestion.difficulty || 0.5) * 800 // convert 0-1 to 0-800
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
      const correct = selectedKey === currentQuestion.correct_key;

      // Insert attempt
      const { error: attemptError } = await supabase
        .from('attempts')
        .insert([{
          user_id: user.id,
          question_id: currentQuestion.id,
          correct,
          time_taken_ms: timeTaken,
          time_taken: timeTaken / 1000
        }]);

      if (attemptError) throw attemptError;

      // Update session stats
      setQuestionCount(prev => prev + 1);
      if (correct) {
        setCorrectCount(prev => prev + 1);
        setUserSkill(prev => Math.min(800, prev + 20));
      } else {
        setUserSkill(prev => Math.max(200, prev - 20));
      }
      setTotalTime(prev => prev + timeTaken);

      toast({
        title: correct ? '✓ Correct!' : '✗ Incorrect',
        description: `Time: ${(timeTaken / 1000).toFixed(1)}s`,
        variant: correct ? 'default' : 'destructive'
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
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/practice" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  if (!activeExam) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/practice" />
        <main className="flex-1 p-6">
          <Card>
            <CardHeader>
              <CardTitle>No Active Exam</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                You need to select an active exam before starting practice.
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

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen w-full bg-background">
        <SideNav activeRoute="/practice" />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
      </div>
    );
  }

  const accuracy = questionCount > 0 ? Math.round((correctCount / questionCount) * 100) : 0;
  const avgTime = questionCount > 0 ? Math.round(totalTime / questionCount / 1000) : 0;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/practice" />
      <main className="flex-1 p-6">
        {/* Stats header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-6 text-sm">
            <span>Question: {questionCount + 1}</span>
            <span>Accuracy: {accuracy}%</span>
            <span>Avg Time: {avgTime}s</span>
          </div>
          <Button variant="outline" onClick={handleEndSession}>
            End Session
          </Button>
        </div>

        {/* Question card */}
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Question {questionCount + 1}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg whitespace-pre-wrap">
              {currentQuestion.stem}
            </div>

            <RadioGroup value={selectedKey} onValueChange={setSelectedKey}>
              <div className="space-y-3">
                {currentQuestion.options.map((option) => (
                  <div key={option.key} className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer">
                    <RadioGroupItem 
                      value={option.key} 
                      id={option.key}
                      disabled={submitting}
                    />
                    <Label 
                      htmlFor={option.key} 
                      className="flex-1 cursor-pointer"
                    >
                      <span className="font-medium mr-2">{option.key}.</span>
                      {option.text}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <Button
              onClick={handleSubmit}
              disabled={!selectedKey || submitting}
              className="w-full"
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
