import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, BookOpen, TrendingUp, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [userName, setUserName] = useState("");
  const [examType, setExamType] = useState("");
  const [stats, setStats] = useState({
    totalAttempts: 0,
    accuracy: 0,
    streak: 0,
  });
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    loadStats();
  }, []);

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("name, exam_type")
      .eq("id", user.id)
      .single();

    if (data) {
      setUserName(data.name);
      setExamType(data.exam_type);
    }
  };

  const loadStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: attempts } = await supabase
      .from("attempts")
      .select("correct")
      .eq("user_id", user.id);

    if (attempts) {
      const accuracy = attempts.length > 0
        ? (attempts.filter(a => a.correct).length / attempts.length) * 100
        : 0;

      setStats({
        totalAttempts: attempts.length,
        accuracy: Math.round(accuracy),
        streak: 0,
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out successfully",
    });
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-primary" />
            <span className="text-xl font-bold">CognitivePrep</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h1>
          <p className="text-muted-foreground">
            Continue your {examType} preparation journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Practice</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Questions attempted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{stats.accuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall performance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Learning Streak</CardTitle>
              <Brain className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{stats.streak}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Days in a row
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Start Practice Session</CardTitle>
              <CardDescription>
                Continue with personalized questions based on your profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/practice")}
                className="w-full"
                size="lg"
              >
                <Brain className="w-4 h-4 mr-2" />
                Start Practice
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>View Insights</CardTitle>
              <CardDescription>
                Analyze your performance and cognitive patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => navigate("/insights")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
