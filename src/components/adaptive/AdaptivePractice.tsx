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
import { Brain, Zap, Clock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: string;
  text: string;
  options: string[] | any;
  correct_option: string;
  difficulty: number;
}

export default function AdaptivePractice() {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [confidence, setConfidence] = useState([50]);
  const [startTime, setStartTime] = useState(Date.now());
  const [questionsCompleted, setQuestionsCompleted] = useState(0);
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<string>("normal");
  const { toast } = useToast();
  const navigate = useNavigate();

  const totalQuestions = 15;

  useEffect(() => {
    loadNextQuestion();
  }, []);

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
            : JSON.parse(question.options as string)
        };
        setCurrentQuestion(parsedQuestion);
        setStyle(data.style || 'normal');
        setSelectedAnswer("");
        setConfidence([50]);
        setStartTime(Date.now());
      }
    } catch (error: any) {
      toast({
        title: "Error loading question",
        description: error.message,
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

      const timeTaken = (Date.now() - startTime) / 1000;
      const isCorrect = selectedAnswer === currentQuestion.correct_option;

      // Save attempt
      const { data: attempt, error: insertError } = await supabase
        .from('attempts')
        .insert({
          user_id: user.id,
          question_id: currentQuestion.id,
          time_taken: timeTaken,
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

      // Show feedback
      toast({
        title: isCorrect ? "Correct!" : "Incorrect",
        description: isCorrect 
          ? `Great job! Time: ${timeTaken.toFixed(1)}s` 
          : `The correct answer was: ${currentQuestion.correct_option}`,
        variant: isCorrect ? "default" : "destructive",
      });

      if (newCompleted >= totalQuestions) {
        setTimeout(() => navigate('/insights'), 1500);
      } else {
        setTimeout(() => loadNextQuestion(), 1500);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
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

        <Button
          onClick={handleSubmit}
          disabled={loading || !selectedAnswer}
          className="w-full"
          size="lg"
        >
          {loading ? "Processing..." : "Submit Answer"}
        </Button>
      </div>
    </div>
  );
}
