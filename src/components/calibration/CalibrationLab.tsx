import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Target, Clock, Zap, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Block = "intro" | "baseline" | "strategy" | "pressure" | "drills" | "wrap";

interface Question {
  id: string;
  text: string;
  options: string[];
  correct_option: string;
}

const STRATEGY_CHIPS = [
  "Estimation",
  "Unit Analysis",
  "First Principles",
  "Elimination",
  "Recall Fact",
  "Case Breakdown",
  "Revenue Math",
  "Funnel Math",
  "Time-Series",
  "Cohort",
  "Segmentation",
  "A/B Reasoning",
  "Heuristic",
];

const RESOURCE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "calculator", label: "Calculator" },
  { value: "notes", label: "Notes" },
  { value: "external_link", label: "External Link" },
];

const ERROR_CAUSES = [
  { value: "misread", label: "Misread Question" },
  { value: "arithmetic", label: "Arithmetic Error" },
  { value: "formula", label: "Wrong Formula" },
  { value: "inference", label: "Faulty Inference" },
  { value: "time", label: "Ran Out of Time" },
  { value: "trap", label: "Fell for Trap" },
  { value: "none", label: "None (Got it Right)" },
];

export function CalibrationLab() {
  const navigate = useNavigate();
  const [currentBlock, setCurrentBlock] = useState<Block>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [itemId, setItemId] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [confidence, setConfidence] = useState([50]);
  const [justification, setJustification] = useState("");
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [effort, setEffort] = useState([3]);
  const [stress, setStress] = useState([3]);
  const [errorCause, setErrorCause] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [checksUnits, setChecksUnits] = useState("");
  const [resourceUsed, setResourceUsed] = useState("none");
  const [resourceDetails, setResourceDetails] = useState("");
  const [perceivedDifficulty, setPerceivedDifficulty] = useState(3);
  const [timer, setTimer] = useState(75);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const blockConfig = {
    intro: { title: "CDNA Calibration Lab", itemCount: 0 },
    baseline: { title: "Block A — Baseline (Timed)", itemCount: 8 },
    strategy: { title: "Block B — Strategy & Justification", itemCount: 24 },
    pressure: { title: "Block C — Pressure Sprint", itemCount: 6 },
    drills: { title: "Block D — Targeted Drills", itemCount: 8 },
    wrap: { title: "Calibration Summary", itemCount: 0 },
  };

  const totalItems = blockConfig[currentBlock].itemCount;
  const progress = totalItems > 0 ? (currentQuestionIndex / totalItems) * 100 : 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const startBlock = async (block: Block) => {
    if (block === "intro" || block === "wrap") {
      setCurrentBlock(block);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('train_ai_sessions')
      .insert({ user_id: user.id, block })
      .select()
      .single();

    if (sessionError || !session) {
      toast.error("Failed to start session");
      return;
    }

    setSessionId(session.id);

    // Fetch questions
    const { data: fetchedQuestions } = await supabase
      .from('question_bank')
      .select('id, text, options, correct_option')
      .limit(blockConfig[block].itemCount);

    if (fetchedQuestions) {
      setQuestions(fetchedQuestions as Question[]);
      setCurrentBlock(block);
      setCurrentQuestionIndex(0);
      
      if (block === "baseline") {
        setTimer(75);
        setIsTimerRunning(true);
      } else if (block === "pressure") {
        setTimer(360);
        setIsTimerRunning(true);
      }
    }
  };

  const submitAnswer = async () => {
    if (!sessionId || !questions[currentQuestionIndex]) return;

    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct_option;

    // Create train_ai_item
    const { data: item } = await supabase
      .from('train_ai_items')
      .insert({
        session_id: sessionId,
        question_id: question.id,
        ended_at: new Date().toISOString(),
        timer_s: currentBlock === "baseline" ? 75 - timer : undefined,
      })
      .select()
      .single();

    if (item) {
      setItemId(item.id);
    }

    // Record attempt
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('attempts').insert({
        user_id: user.id,
        question_id: question.id,
        mode: 'lab',
        time_taken: currentBlock === "baseline" ? (75 - timer) * 1000 : undefined,
        correct: isCorrect,
        confidence: confidence[0] / 100,
      });
    }

    // For strategy block, show justification form
    if (currentBlock === "strategy") {
      // Stay on same question to collect justification
      return;
    }

    nextQuestion();
  };

  const submitJustification = async () => {
    if (!itemId || isSubmitting) return;

    // Validate minimum 180 characters
    if (justification.trim().length < 180) {
      toast.error('Please provide a more detailed explanation (minimum 180 characters)');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check user's last adjudication quality using RPC
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSubmitting(false);
        return;
      }

      // Get active exam
      const { data: enrollment } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (enrollment) {
        const { data: lastJqs, error: jqsError } = await supabase
          .rpc('get_last_jqs_for_user_exam', {
            p_user: user.id,
            p_exam: enrollment.exam_id
          })
          .maybeSingle();

        if (jqsError) {
          console.error('Error fetching last JQS:', jqsError);
        }

        if (lastJqs && lastJqs.jqs_0_1 < 0.35) {
          toast.error('Your last justification needed improvement. Please provide more detail, explain your reasoning step-by-step, and show your work clearly.');
          setIsSubmitting(false);
          return;
        }
      }

      // Upsert justification (one per item)
      const { data: insertedJustification, error: insertError } = await supabase
        .from('user_justifications')
        .upsert({
          train_ai_item_id: itemId,
          text: justification,
          strategy_tags: selectedStrategies,
          effort_1_5: effort[0],
          stress_1_5: stress[0],
          error_cause: errorCause,
          assumptions_text: assumptions,
          checks_units: checksUnits,
          resources_used: { type: resourceUsed, details: resourceDetails || null },
          perceived_difficulty_1_5: perceivedDifficulty,
        }, { onConflict: 'train_ai_item_id' })
        .select()
        .single();

      if (insertError) {
        console.error('Error upserting justification:', insertError);
        toast.error('Failed to save justification');
        setIsSubmitting(false);
        return;
      }

      // Enqueue LLM evaluation (idempotent)
      if (insertedJustification?.id) {
        const { error: enqueueError } = await supabase.functions.invoke('enqueue-llm-eval', {
          body: { justification_id: insertedJustification.id }
        });

        if (enqueueError) {
          console.error('Error enqueueing LLM eval:', enqueueError);
          // Don't block user flow if enqueue fails
        } else {
          console.log('LLM eval enqueued for justification:', insertedJustification.id);
        }
      }

      toast.success('Justification saved');

      // Reset justification form
      setJustification("");
      setSelectedStrategies([]);
      setEffort([3]);
      setStress([3]);
      setErrorCause("");
      setAssumptions("");
      setChecksUnits("");
      setResourceUsed("none");
      setResourceDetails("");
      setPerceivedDifficulty(3);

      nextQuestion();
    } catch (error: any) {
      console.error('Error in submitJustification:', error);
      toast.error(`Failed to submit: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 >= questions.length) {
      // Block complete
      completeBlock();
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer("");
      setConfidence([50]);
      setIsTimerRunning(false);
      
      if (currentBlock === "baseline") {
        setTimer(75);
        setIsTimerRunning(true);
      }
    }
  };

  const completeBlock = async () => {
    if (sessionId) {
      await supabase
        .from('train_ai_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }

    const blockOrder: Block[] = ["baseline", "strategy", "pressure", "drills"];
    const currentIndex = blockOrder.indexOf(currentBlock);
    
    if (currentIndex < blockOrder.length - 1) {
      setCurrentBlock("intro");
      toast.success(`${blockConfig[currentBlock].title} completed!`);
    } else {
      setCurrentBlock("wrap");
    }
  };

  const toggleStrategy = (strategy: string) => {
    setSelectedStrategies(prev =>
      prev.includes(strategy)
        ? prev.filter(s => s !== strategy)
        : [...prev, strategy]
    );
  };

  if (currentBlock === "intro") {
    return (
      <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              CDNA Calibration Lab
            </CardTitle>
            <CardDescription className="text-base">
              Invest ~60 minutes across 2 sittings to unlock full AI personalization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={() => startBlock("baseline")}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Block A — Baseline (Timed)</div>
                  <div className="text-sm text-muted-foreground">8 questions, 75s each</div>
                </div>
              </Button>
              <Button
                onClick={() => startBlock("strategy")}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Block B — Strategy & Justification</div>
                  <div className="text-sm text-muted-foreground">24 questions with explanations</div>
                </div>
              </Button>
              <Button
                onClick={() => startBlock("pressure")}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Block C — Pressure Sprint</div>
                  <div className="text-sm text-muted-foreground">6 questions, 6 minutes total</div>
                </div>
              </Button>
              <Button
                onClick={() => startBlock("drills")}
                className="w-full justify-start h-auto py-4"
                variant="outline"
              >
                <div className="text-left">
                  <div className="font-semibold">Block D — Targeted Drills</div>
                  <div className="text-sm text-muted-foreground">8 focused strategy exercises</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (currentBlock === "wrap") {
    return (
      <div className="min-h-screen bg-muted/30 p-8 flex items-center justify-center">
        <Card className="max-w-2xl w-full shadow-xl">
          <CardHeader>
            <CardTitle className="text-3xl flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-success" />
              Calibration Complete!
            </CardTitle>
            <CardDescription className="text-base">
              Your Cognitive DNA Engine is now calibrated
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You've completed the calibration program. The AI now has a deep understanding of your problem-solving patterns and can provide truly personalized adaptive practice.
            </p>
            <Button
              onClick={() => navigate("/practice")}
              className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] rounded-xl h-12"
              size="lg"
            >
              Proceed to Adaptive Practice
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return <div>Loading...</div>;

  const needsJustification = currentBlock === "strategy" && selectedAnswer && !justification;

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{blockConfig[currentBlock].title}</h1>
            <p className="text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalItems}
            </p>
          </div>
          {(currentBlock === "baseline" || currentBlock === "pressure") && (
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="text-xl font-mono">{Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}</span>
            </div>
          )}
        </div>

        <Progress value={progress} className="h-2" />

        {/* Question Card */}
        {!needsJustification ? (
          <Card className="shadow-lg bg-white text-black">
            <CardHeader>
              <CardTitle className="text-lg leading-relaxed text-black">{currentQuestion.text}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                {currentQuestion.options.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="cursor-pointer text-black">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              {(currentBlock === "baseline" || currentBlock === "pressure") && (
                <div className="space-y-2">
              <Label className="text-black">Confidence: {confidence[0]}%</Label>
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    min={0}
                    max={100}
                    step={10}
                  />
                </div>
              )}

              <Button
                onClick={submitAnswer}
                disabled={!selectedAnswer}
                className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] rounded-xl h-12"
              >
                Submit Answer
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-lg bg-white text-black">
            <CardHeader>
              <CardTitle className="text-black">Explain Your Reasoning</CardTitle>
              <CardDescription className="text-black">
                Help the AI understand your problem-solving approach (max 300 characters)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                placeholder="Describe your approach, the strategies you used, and your reasoning..."
                maxLength={300}
                rows={5}
                className="resize-none"
              />
              <p className={justification.trim().length < 180 ? 'text-amber-500 text-xs text-right' : 'text-muted-foreground text-xs text-right'}>
                {justification.trim().length}/300 characters (minimum 180)
              </p>

              <div>
                <Label className="mb-2 block text-black">Strategies Used:</Label>
                <div className="flex flex-wrap gap-2">
                  {STRATEGY_CHIPS.map((strategy) => (
                    <Badge
                      key={strategy}
                      variant={selectedStrategies.includes(strategy) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer",
                        !selectedStrategies.includes(strategy) && "text-black bg-white"
                      )}
                      onClick={() => toggleStrategy(strategy)}
                    >
                      {strategy}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black">Mental Effort: {effort[0]}/5</Label>
                  <Slider
                    value={effort}
                    onValueChange={setEffort}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-black">Stress Level: {stress[0]}/5</Label>
                  <Slider
                    value={stress}
                    onValueChange={setStress}
                    min={1}
                    max={5}
                    step={1}
                  />
                </div>
              </div>

              <div>
                <Label className="mb-2 block text-black">Assumptions Made:</Label>
                <Textarea
                  value={assumptions}
                  onChange={(e) => setAssumptions(e.target.value)}
                  placeholder="List any assumptions you made while solving..."
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div>
                <Label className="mb-2 block text-black">Checks / Units / Edge Cases:</Label>
                <input
                  type="text"
                  value={checksUnits}
                  onChange={(e) => setChecksUnits(e.target.value)}
                  placeholder="Dimensional checks, rounding decisions, edge cases verified..."
                  className="w-full px-3 py-2 border border-input rounded-md text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-black">Resources Used:</Label>
                  <select
                    value={resourceUsed}
                    onChange={(e) => setResourceUsed(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md text-black"
                  >
                    {RESOURCE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-black">Perceived Difficulty:</Label>
                  <select
                    value={perceivedDifficulty}
                    onChange={(e) => setPerceivedDifficulty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-input rounded-md text-black"
                  >
                    <option value={1}>1 - Very Easy</option>
                    <option value={2}>2 - Easy</option>
                    <option value={3}>3 - Medium</option>
                    <option value={4}>4 - Hard</option>
                    <option value={5}>5 - Very Hard</option>
                  </select>
                </div>
              </div>

              {resourceUsed !== "none" && (
                <div>
                  <Label className="mb-2 block text-black">Resource Details:</Label>
                  <input
                    type="text"
                    value={resourceDetails}
                    onChange={(e) => setResourceDetails(e.target.value)}
                    placeholder={resourceUsed === "external_link" ? "URL or description..." : "Details..."}
                    className="w-full px-3 py-2 border border-input rounded-md text-black"
                  />
                </div>
              )}

              <div>
                <Label className="mb-2 block text-black">If incorrect, what was the main cause?</Label>
                <RadioGroup value={errorCause} onValueChange={setErrorCause}>
                  {ERROR_CAUSES.map((cause) => (
                    <div key={cause.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={cause.value} id={cause.value} />
                      <Label htmlFor={cause.value} className="cursor-pointer text-black">
                        {cause.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <Button
                onClick={submitJustification}
                disabled={isSubmitting || !justification || justification.trim().length < 180}
                className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] rounded-xl h-12"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Justification'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
