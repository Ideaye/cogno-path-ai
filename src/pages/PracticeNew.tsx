import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Loader2, ChevronDown, CheckCircle2, XCircle, SkipForward } from 'lucide-react';
import { usePractice } from '@/hooks/usePractice';
import ReactMarkdown from 'react-markdown';

export default function PracticeNew() {
  const navigate = useNavigate();
  const {
    state,
    examName,
    currentItem,
    selectedKey,
    setSelectedKey,
    freeResponse,
    setFreeResponse,
    confidence,
    setConfidence,
    explanation,
    isCorrect,
    questionCount,
    accuracy,
    avgTimeMs,
    init,
    submit,
    skip,
    next
  } = usePractice();

  useEffect(() => {
    init();
  }, [init]);

  function handleEndSession() {
    navigate('/dashboard');
  }

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-6 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (state === 'error' || !currentItem) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 p-6">
          <GlassCard className="p-8 text-center max-w-md mx-auto">
            <h2 className="text-2xl font-semibold mb-4">Unable to Load Practice</h2>
            <p className="text-foreground/70 mb-6">
              Please select an active course in settings and try again.
            </p>
            <Button onClick={() => navigate('/settings')}>
              Go to Settings
            </Button>
          </GlassCard>
        </main>
      </div>
    );
  }

  const canSubmit = (state === 'presenting') && (currentItem.type === 'MCQ' 
    ? selectedKey !== '' 
    : freeResponse.trim().length > 0);

  return (
    <div className="flex min-h-screen w-full">
      <CollapsibleSideNav />
      <main className="flex-1 p-6">
        {/* Stats header */}
        <GlassCard className="mb-6 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{examName}</span>
              <Separator orientation="vertical" className="h-4" />
              <div className="flex gap-6 text-sm">
                <span className="font-medium text-foreground">Q: <span className="text-primary">{questionCount + 1}</span></span>
                <span className="font-medium text-foreground">Accuracy: <span className="text-primary">{accuracy}%</span></span>
                <span className="font-medium text-foreground">Avg: <span className="text-primary">{(avgTimeMs / 1000).toFixed(1)}s</span></span>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={handleEndSession}
              size="sm"
            >
              End Session
            </Button>
          </div>
        </GlassCard>

        {/* Question card */}
        {state === 'presenting' && (
          <GlassCard className="max-w-3xl mx-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">Question {questionCount + 1}</h2>
                <Badge variant="outline">{currentItem.type}</Badge>
              </div>
              
              <div className="prose prose-sm max-w-none text-foreground">
                <ReactMarkdown>{currentItem.stem_md}</ReactMarkdown>
              </div>

              {currentItem.type === 'MCQ' && currentItem.options ? (
                <RadioGroup value={selectedKey} onValueChange={setSelectedKey}>
                  <div className="space-y-3">
                    {currentItem.options.map((option) => (
                      <div 
                        key={option.key} 
                        className="flex items-start space-x-3 border-2 border-border rounded-lg p-4 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                      >
                        <RadioGroupItem 
                          value={option.key} 
                          id={option.key}
                          className="mt-1"
                        />
                        <Label 
                          htmlFor={option.key} 
                          className="flex-1 cursor-pointer text-foreground leading-relaxed"
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
                  <Label htmlFor="answer-input" className="text-foreground">Your Answer</Label>
                  <Textarea
                    id="answer-input"
                    value={freeResponse}
                    onChange={(e) => setFreeResponse(e.target.value)}
                    placeholder="Type your answer here..."
                    className="mt-2 min-h-[120px]"
                  />
                </div>
              )}

              {/* Optional confidence slider */}
              <div className="space-y-2">
                <Label className="text-sm text-foreground/70">
                  Confidence (optional): {confidence !== null ? `${Math.round(confidence * 100)}%` : 'Not set'}
                </Label>
                <Slider
                  value={confidence !== null ? [confidence * 100] : [50]}
                  onValueChange={(val) => setConfidence(val[0] / 100)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={skip}
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={state !== 'presenting'}
                >
                  <SkipForward className="mr-2 h-4 w-4" />
                  Skip
                </Button>
                <Button
                  onClick={submit}
                  disabled={!canSubmit}
                  size="lg"
                  className="flex-1"
                >
                  {state !== 'presenting' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Answer'
                  )}
                </Button>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Verdict panel */}
        {state === 'verdict' && explanation && (
          <GlassCard className="max-w-3xl mx-auto">
            <div className="p-6 space-y-6">
              {/* Result badge */}
              <div className="flex items-center justify-center">
                {isCorrect === true && (
                  <Badge variant="default" className="text-lg py-2 px-4 bg-green-100 text-green-800 border-green-300">
                    <CheckCircle2 className="mr-2 h-5 w-5" />
                    Correct!
                  </Badge>
                )}
                {isCorrect === false && (
                  <Badge variant="destructive" className="text-lg py-2 px-4">
                    <XCircle className="mr-2 h-5 w-5" />
                    Incorrect
                  </Badge>
                )}
                {isCorrect === null && (
                  <Badge variant="outline" className="text-lg py-2 px-4">
                    Skipped
                  </Badge>
                )}
              </div>

              <Separator />

              {/* Explanation */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-foreground mb-2">Explanation</h3>
                  <div className="prose prose-sm max-w-none text-foreground/90">
                    <ReactMarkdown>{explanation.short_justification_md}</ReactMarkdown>
                  </div>
                </div>

                {explanation.solution_steps_md && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                      <ChevronDown className="h-4 w-4" />
                      Show solution steps
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 prose prose-sm max-w-none text-foreground/80">
                      <ReactMarkdown>{explanation.solution_steps_md}</ReactMarkdown>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {explanation.why_others_wrong_md && (
                  <Collapsible>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                      <ChevronDown className="h-4 w-4" />
                      Why other options are wrong
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2 prose prose-sm max-w-none text-foreground/80">
                      <ReactMarkdown>{explanation.why_others_wrong_md}</ReactMarkdown>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Tags */}
                {(explanation.misconception_tags.length > 0 || currentItem.concept_tags.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {currentItem.concept_tags.map(tag => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                    {explanation.misconception_tags.map(tag => (
                      <Badge key={tag} variant="outline" className="border-orange-300 text-orange-700">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={next}
                  size="lg"
                  className="flex-1"
                >
                  Next Question
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {/* TODO: Report issue */}}
                >
                  Report Issue
                </Button>
              </div>
            </div>
          </GlassCard>
        )}
      </main>
    </div>
  );
}