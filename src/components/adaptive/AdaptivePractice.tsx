import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Brain, Zap, Clock, Target, Flag, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type QuestionOption = string[] | string;

interface Question {
  id: string;
  text: string;
  options: QuestionOption;
  correct_option: string;
  difficulty: number;
}

type QState = "unseen" | "seen" | "flagged" | "correct" | "incorrect";

interface QItem {
  id: string;
  label: number;
  state: QState;
  difficulty?: number;
}

export function AdaptivePractice() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [confidence, setConfidence] = useState([50]);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<string>("normal");
  const [stackOpen, setStackOpen] = useState(true);
  const [qStack, setQStack] = useState<QItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flagged, setFlagged] = useState(false);
  const [showGatingDialog, setShowGatingDialog] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalQuestions = 15;

  // Check calibration progress on mount
  useEffect(() => {
    checkCalibrationGating();
  }, []);

  const checkCalibrationGating = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: active } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!active?.exam_id) return;

      const { data } = await supabase
        .from('feature_user_exam_daily')
        .select('calibration_progress_0_1')
        .eq('user_id', user.id)
        .eq('exam_id', active.exam_id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      const p = data?.calibration_progress_0_1 ?? 0;
      setCalibrationProgress(p);

      if (p < 0.7) {
        setShowGatingDialog(true);
      }
    } catch (error) {
      console.error('Error checking calibration:', error);
    }
  };

  useEffect(() => {
    if (!showGatingDialog) {
      loadNextQuestion();
    }
  }, [showGatingDialog]);

  const loadNextQuestion = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // First, compute latest features
      await supabase.functions.invoke('compute-features', {
        body: { user_id: user.id }
      });

      // Call adaptive selection
      const { data, error } = await supabase.functions.invoke('adaptive-select-next', {
        body: { user_id: user.id }
      });

        if (error) throw error;

        if (data?.question) {
          const question = data.question;
          const parsedQuestion = {
            ...question,
            options: Array.isArray(question.options)
              ? question.options
              : JSON.parse(question.options as string),
          };
          setCurrentQuestion(parsedQuestion);
          setStyle(data.style || "normal");
          setSelectedAnswer("");
          setConfidence([50]);
          setFlagged(false);
          setStartTime(Date.now());

          // Add to stack
          setQStack((prev) => {
            const newItem: QItem = {
              id: parsedQuestion.id,
              label: prev.length + 1,
              state: "seen",
              difficulty: parsedQuestion.difficulty,
            };
            const nextStack = [...prev, newItem];
            setCurrentIndex(nextStack.length - 1);
            return nextStack;
          });
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        toast({
          title: "Error loading question",
          description: message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

  const handleSubmit = async () => {
    if (!selectedAnswer || !currentQuestion) {
      toast({
        title: "Please select an answer",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

        const elapsedMs = Date.now() - startTime;
        const timeTakenSeconds = elapsedMs / 1000;
      const isCorrect = selectedAnswer === currentQuestion.correct_option;

      // Save attempt
      const { data: attempt, error: insertError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
            time_taken: timeTakenSeconds,
            time_taken_ms: elapsedMs,
          correct: isCorrect,
          confidence: confidence[0] / 100,
          attempt_number: 1,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Record reward for bandit update
      await supabase.functions.invoke('record-reward', {
        body: { attempt_id: attempt.id }
      });

      const newCompleted = questionsCompleted + 1;
      setQuestionsCompleted(newCompleted);

      // Update stack state
      setQStack(prev => prev.map((item, idx) => 
        idx === currentIndex 
          ? { ...item, state: (flagged ? "flagged" : isCorrect ? "correct" : "incorrect") as QState }
          : item
      ));

      // Show feedback
      toast({
        title: isCorrect ? "Correct!" : "Incorrect",
        description: isCorrect 
            ? `Great job! Time: ${timeTakenSeconds.toFixed(1)}s` 
          : `The correct answer was: ${currentQuestion.correct_option}`,
        variant: isCorrect ? "default" : "destructive",
      });

      if (newCompleted >= totalQuestions) {
        setTimeout(() => navigate('/insights'), 1500);
      } else {
        setTimeout(() => loadNextQuestion(), 1500);
      }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
      toast({
        title: "Error",
          description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = () => {
    setFlagged(!flagged);
    setQStack(prev => prev.map((item, idx) => 
      idx === currentIndex 
        ? { ...item, state: !flagged ? "flagged" : "seen" }
        : item
    ));
  };

  if (loading && !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">AI is selecting your next question...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Questions Available</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = (questionsCompleted / totalQuestions) * 100;

  const LeftStack = () => (
    <aside className={`h-full ${stackOpen ? "w-64" : "w-12"} transition-all bg-[#0B0F19] text-gray-200 flex flex-col`}>
      <button 
        className="p-3 hover:bg-white/5 flex items-center justify-center"
        onClick={() => setStackOpen(!stackOpen)}
      >
        {stackOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      {stackOpen && (
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          <div className="text-xs uppercase tracking-wider text-gray-400 px-2 py-3">
            Questions
          </div>
          <ul className="space-y-1">
            {qStack.map((q, idx) => (
              <li 
                key={q.id} 
                className={`flex items-center justify-between rounded-md px-2 py-2 cursor-pointer hover:bg-white/5 ${idx === currentIndex ? 'bg-white/10' : ''}`}
                onClick={() => setCurrentIndex(idx)}
              >
                <span className="text-sm font-medium">Q{q.label}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${
                  q.state === "unseen" ? "bg-gray-500" :
                  q.state === "seen" ? "bg-blue-400" :
                  q.state === "flagged" ? "bg-amber-400" :
                  q.state === "correct" ? "bg-emerald-500" : "bg-rose-500"
                }`} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <AlertDialog open={showGatingDialog} onOpenChange={setShowGatingDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finish Calibration</AlertDialogTitle>
            <AlertDialogDescription>
              Complete at least 24 justified items (you're at {Math.round(calibrationProgress * 24)}/24) to unlock full adaptive mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => navigate('/calibration')}>
              Go to Calibration Lab
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => setShowGatingDialog(false)}>
              Continue (limited)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex">
        <LeftStack />
        <div className="flex-1 p-4 py-8">
          <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-accent" />
              Adaptive Practice
            </h1>
            <div className="flex items-center gap-4">
              <Badge variant="secondary">
                <Target className="w-3 h-3 mr-1" />
                {style}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {questionsCompleted + 1} / {totalQuestions}
              </span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Difficulty: {(currentQuestion.difficulty * 10).toFixed(1)}/10
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{Math.floor((Date.now() - startTime) / 1000)}s</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQuestion.options.map((option: string, index: number) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedAnswer(option)}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label
                      htmlFor={`option-${index}`}
                      className="flex-1 cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-3 block">
                How confident are you? ({confidence[0]}%)
              </Label>
              <Slider
                value={confidence}
                onValueChange={setConfidence}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Not confident</span>
                <span>Very confident</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={toggleFlag}
            className="flex-shrink-0"
            size="lg"
          >
            <Flag className={`w-4 h-4 ${flagged ? 'fill-amber-400 text-amber-400' : ''}`} />
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedAnswer}
            className="flex-1"
            size="lg"
          >
            {loading ? "Processing..." : "Submit Answer"}
          </Button>
        </div>
          </div>
        </div>
      </div>
    </>
  );
}
