import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingUp, Target, Clock, Zap, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ConceptMastery {
  name: string;
  mastery: number;
}

export default function InsightsPage() {
  const [stats, setStats] = useState({
    totalAttempts: 0,
    accuracy: 0,
    avgTime: 0,
    avgConfidence: 0,
  });
  const [conceptMastery, setConceptMastery] = useState<ConceptMastery[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load attempts
      const { data: attempts } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (attempts) {
        const accuracy = attempts.length > 0
          ? (attempts.filter(a => a.correct).length / attempts.length) * 100
          : 0;
        const avgTime = attempts.length > 0
          ? attempts.reduce((sum, a) => sum + a.time_taken, 0) / attempts.length
          : 0;
        const avgConfidence = attempts.length > 0
          ? attempts.reduce((sum, a) => sum + (a.confidence || 0), 0) / attempts.length * 100
          : 0;

        setStats({
          totalAttempts: attempts.length,
          accuracy: Math.round(accuracy),
          avgTime: Math.round(avgTime * 10) / 10,
          avgConfidence: Math.round(avgConfidence),
        });
      }

      // Load feature snapshot for mastery
      const { data: features } = await supabase
        .from('feature_user_daily')
        .select('mastery_vector')
        .eq('user_id', user.id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .single();

      if (features?.mastery_vector) {
        const masteryData = features.mastery_vector as Record<string, number>;
        
        // Get concept names
        const conceptIds = Object.keys(masteryData);
        if (conceptIds.length > 0) {
          const { data: concepts } = await supabase
            .from('concepts')
            .select('id, name')
            .in('id', conceptIds);

          const conceptMap = new Map(concepts?.map(c => [c.id, c.name]) || []);
          
          const masteryList = Object.entries(masteryData)
            .map(([id, mastery]) => ({
              name: conceptMap.get(id) || 'Unknown',
              mastery: Math.round(mastery * 100),
            }))
            .sort((a, b) => b.mastery - a.mastery);

          setConceptMastery(masteryList);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error loading insights",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Brain className="w-12 h-12 animate-pulse text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              Performance Insights
            </h1>
            <p className="text-muted-foreground">AI-powered analytics of your learning journey</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Target className="w-4 h-4 text-success" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-success">{stats.accuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalAttempts} total attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Avg Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">{stats.avgTime}s</div>
              <p className="text-xs text-muted-foreground mt-1">Per question</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-accent" />
                Confidence
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{stats.avgConfidence}%</div>
              <p className="text-xs text-muted-foreground mt-1">Average level</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Brain className="w-4 h-4 text-secondary" />
                Concepts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{conceptMastery.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Tracked areas</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Concept Mastery</CardTitle>
            <CardDescription>
              Your performance across different topics (AI-tracked)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {conceptMastery.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Complete more practice sessions to see concept mastery data
              </p>
            ) : (
              <div className="space-y-4">
                {conceptMastery.map((concept, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-32 font-medium">{concept.name}</div>
                    <div className="flex-1">
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-destructive via-accent to-success transition-all"
                          style={{ 
                            width: `${concept.mastery}%`,
                            background: concept.mastery > 70 
                              ? 'hsl(var(--success))' 
                              : concept.mastery > 50 
                                ? 'hsl(var(--accent))' 
                                : 'hsl(var(--destructive))'
                          }}
                        />
                      </div>
                    </div>
                    <Badge variant={concept.mastery > 70 ? "default" : "secondary"}>
                      {concept.mastery}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6">
          <Button onClick={() => navigate('/practice')} className="w-full" size="lg">
            Continue Practice
          </Button>
        </div>
      </div>
    </div>
  );
}
