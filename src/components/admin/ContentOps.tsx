import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import AuditChips from "./AuditChips";

export function ContentOps() {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExam, setSelectedExam] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [conceptTags, setConceptTags] = useState<string>("");
  const [count, setCount] = useState<number>(10);
  const [minQuality, setMinQuality] = useState<number>(0.7);
  const [generating, setGenerating] = useState(false);
  const [quarantineItems, setQuarantineItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExams();
    loadQuarantine();
  }, []);

  const loadExams = async () => {
    const { data } = await supabase.from('exams').select('*');
    if (data) setExams(data);
  };

  const loadQuarantine = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_items_quarantine')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setQuarantineItems(data);
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!selectedExam || !section || !conceptTags) {
      toast({
        title: "Missing fields",
        description: "Please fill exam, section, and concept tags",
        variant: "destructive"
      });
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('aif-generate', {
        body: {
          exam_id: selectedExam,
          section,
          concept_tags: conceptTags.split(',').map(t => t.trim()),
          count,
          difficulty_mix: { easy: 0.3, medium: 0.5, hard: 0.2 },
          required_strategy_pct: 0.3
        }
      });

      if (error) throw error;

      toast({
        title: "Generation complete",
        description: `Generated ${data.inserted} items (${data.duplicates} duplicates, ${data.errors} errors)`
      });

      loadQuarantine();
    } catch (e: any) {
      toast({
        title: "Generation failed",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Select items to approve",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('aif-approve', {
        body: {
          aiq_ids: selectedItems,
          min_quality: minQuality
        }
      });

      if (error) throw error;

      toast({
        title: "Approval complete",
        description: `Inserted ${data.inserted} items (${data.skipped} skipped, ${data.duplicates} duplicates)`
      });

      setSelectedItems([]);
      loadQuarantine();
    } catch (e: any) {
      toast({
        title: "Approval failed",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFillGaps = async () => {
    if (!selectedExam) {
      toast({
        title: "No exam selected",
        description: "Select an exam first",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('aif-coverage-planner', {
        body: {
          exam_id: selectedExam,
          target_per_section: 40
        }
      });

      if (error) throw error;

      toast({
        title: "Coverage planning complete",
        description: `Filled ${data.plan?.length || 0} section gaps`
      });

      loadQuarantine();
    } catch (e: any) {
      toast({
        title: "Coverage planning failed",
        description: e.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-rose-500" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Content Operations</h1>
        <p className="text-muted-foreground">AI-powered question generation and management</p>
      </div>

      <div className="mb-4">
        <AuditChips />
      </div>

      {/* Generate Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Questions</CardTitle>
          <CardDescription>Create new AI-generated questions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Exam</Label>
              <Select value={selectedExam} onValueChange={setSelectedExam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select exam" />
                </SelectTrigger>
                <SelectContent>
                  {exams.map(exam => (
                    <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Section</Label>
              <Input 
                placeholder="e.g., QA, DILR, VARC"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Concept Tags (comma-separated)</Label>
            <Input 
              placeholder="e.g., algebra, simultaneous_equations"
              value={conceptTags}
              onChange={(e) => setConceptTags(e.target.value)}
            />
          </div>
          <div>
            <Label>Count: {count}</Label>
            <Slider 
              value={[count]} 
              onValueChange={([v]) => setCount(v)}
              min={1}
              max={50}
              step={1}
            />
          </div>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Generate {count} Questions
          </Button>
        </CardContent>
      </Card>

      {/* Quarantine Review */}
      <Card>
        <CardHeader>
          <CardTitle>Quarantine Review</CardTitle>
          <CardDescription>
            Review and approve generated questions (min quality: {minQuality.toFixed(2)})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Minimum Quality Score</Label>
            <Slider 
              value={[minQuality * 100]} 
              onValueChange={([v]) => setMinQuality(v / 100)}
              min={0}
              max={100}
              step={5}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleApprove} 
              disabled={loading || selectedItems.length === 0}
            >
              Approve Selected ({selectedItems.length})
            </Button>
            <Button onClick={loadQuarantine} variant="outline" disabled={loading}>
              Refresh
            </Button>
            <Button onClick={handleFillGaps} variant="secondary" disabled={loading}>
              Fill Coverage Gaps
            </Button>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : quarantineItems.length === 0 ? (
              <p className="text-muted-foreground text-center p-8">No items in quarantine</p>
            ) : (
              quarantineItems.map(item => {
                const payload = item.payload_json as any;
                return (
                  <Card 
                    key={item.id}
                    className={`cursor-pointer transition-colors ${
                      selectedItems.includes(item.id) ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => item.status === 'validated' && toggleSelection(item.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className="text-xs font-medium">{item.status}</span>
                            <span className="text-xs text-muted-foreground">
                              Quality: {(item.quality_score || 0).toFixed(2)}
                            </span>
                            {item.required_strategy && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/10">
                                {item.required_strategy}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium">{payload.stem}</p>
                          <div className="text-xs space-y-1">
                            {payload.options?.map((opt: string, i: number) => (
                              <div 
                                key={i}
                                className={i === payload.correct_index ? 'text-emerald-600 font-medium' : ''}
                              >
                                {String.fromCharCode(65 + i)}. {opt}
                              </div>
                            ))}
                          </div>
                          {item.issues?.length > 0 && (
                            <div className="text-xs text-amber-600">
                              Issues: {item.issues.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
