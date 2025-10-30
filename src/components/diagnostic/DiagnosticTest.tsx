import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Brain, Clock, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Question {
  id: string;
  text: string;
  options: string[] | any;
  correct_option: string;
  concept_tag: string;
}

export default function DiagnosticTest() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [confidence, setConfidence] = useState([50]);
  const [startTime, setStartTime] = useState(Date.now());
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("question_bank")
      .select("*")
      .limit(10);

    if (error) {
      toast({
        title: "Error loading questions",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    if (data) {
      const parsedQuestions = data.map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : JSON.parse(q.options as string)
      }));
      setQuestions(parsedQuestions);
    }
  };

  const handleNext = async () => {
    if (!selectedAnswer) {
      toast({
        title: "Please select an answer",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = questions[currentIndex];
    const timeTaken = (Date.now() - startTime) / 1000;
    const isCorrect = selectedAnswer === currentQuestion.correct_option;

    const result = {
      question_id: currentQuestion.id,
      time_taken: timeTaken,
      confidence: confidence[0] / 100,
      correct: isCorrect,
      revisit_count: 0,
      hesitation_count: confidence[0] < 50 ? 1 : 0,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer("");
      setConfidence([50]);
      setStartTime(Date.now());
    } else {
      await submitDiagnostic(newResults);
    }
  };

  const submitDiagnostic = async (diagnosticResults: any[]) => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Save all diagnostic results
      const resultsToInsert = diagnosticResults.map(r => ({
        ...r,
        user_id: user.id,
      }));

      const { error: insertError } = await supabase
        .from("diagnostic_results")
        .insert(resultsToInsert);

      if (insertError) throw insertError;

      // Call edge function to generate cognitive profile
      const { error: functionError } = await supabase.functions.invoke(
        "generate-cognitive-profile",
        { body: { user_id: user.id } }
      );

      if (functionError) throw functionError;

      toast({
        title: "Diagnostic Complete!",
        description: "Your cognitive profile has been generated.",
      });

      navigate("/profile");
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

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Brain className="w-12 h-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading questions...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="w-6 h-6 text-primary" />
              Diagnostic Test
            </h1>
            <span className="text-sm text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{currentQuestion.text}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{Math.floor((Date.now() - startTime) / 1000)}s</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
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
          onClick={handleNext}
          disabled={loading || !selectedAnswer}
          className="w-full"
          size="lg"
        >
          {loading ? (
            "Processing..."
          ) : currentIndex < questions.length - 1 ? (
            "Next Question"
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Complete Test
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
