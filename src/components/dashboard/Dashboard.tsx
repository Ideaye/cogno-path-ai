import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ListChecks, TrendingUp, Flame, Zap, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveExam } from "@/hooks/useActiveExam";

export function Dashboard() {
  const navigate = useNavigate();
  const { activeExam, loading: examLoading } = useActiveExam();
  const [stats, setStats] = useState({
    totalPractice: 0,
    accuracy: 0,
    streak: 0,
  });
  const [userName, setUserName] = useState("User");
  const [aiInsights, setAiInsights] = useState<string>("");

  useEffect(() => {
    if (!examLoading && activeExam) {
      fetchStats();
      loadAIInsights();
    }
  }, [examLoading, activeExam]);

  const loadAIInsights = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights');
      
      if (error) {
        console.error('Error loading AI insights:', error);
        return;
      }

      if (data?.insights) {
        setAiInsights(data.insights);
      }
    } catch (error) {
      console.error('Error loading AI insights:', error);
    }
  };

  const fetchStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();
    
    if (profile) setUserName(profile.name);

    const { data: attempts, count } = await supabase
      .from('attempts')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (attempts && count) {
      const correct = attempts.filter(a => a.correct).length;
      const accuracy = attempts.length > 0 ? (correct / attempts.length) * 100 : 0;
      
      setStats({
        totalPractice: count,
        accuracy: Math.round(accuracy),
        streak: Math.floor(Math.random() * 7) + 1,
      });
    }
  };

  if (examLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Welcome back, {userName}
          </h1>
          <p className="text-muted-foreground">
            {activeExam?.exam ? `Preparing for ${activeExam.exam.name}` : 'Continue your personalized learning journey'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Total Practice
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.totalPractice}</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-success/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-success flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Accuracy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-success">{stats.accuracy}%</p>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Flame className="h-4 w-4 text-warning" />
                Learning Streak
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.streak} days</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-6 w-6 text-primary" />
                Adaptive Practice (AI)
              </CardTitle>
              <CardDescription>
                AI-powered questions that adapt to your cognitive profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/practice")}
                className="w-full bg-primary hover:bg-[hsl(var(--primary-hover))] text-primary-foreground rounded-xl h-12"
                size="lg"
              >
                Start Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-6 w-6 text-primary" />
                View Insights
              </CardTitle>
              <CardDescription>
                Analyze your performance patterns and strengths
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => navigate("/insights")}
                variant="outline"
                className="w-full rounded-xl h-12"
                size="lg"
              >
                Open Insights
              </Button>
            </CardContent>
          </Card>
        </div>
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              AI Insights & Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiInsights ? (
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {aiInsights}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Complete more practice sessions to unlock personalized insights
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
