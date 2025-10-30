import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Target, Clock, TrendingUp, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface CognitiveProfile {
  avgTime?: number;
  avgConfidence?: number;
  accuracy?: number;
  profileType?: string;
  strengths?: string[];
  areasForImprovement?: string[];
}

export default function ProfileSummary() {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("name, cognitive_profile")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserName(data.name);
        setProfile(data.cognitive_profile as CognitiveProfile);
      }
    } catch (error: any) {
      toast({
        title: "Error loading profile",
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

  if (!profile || !profile.profileType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>No Profile Found</CardTitle>
            <CardDescription>Please complete the diagnostic test first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/diagnostic")}>
              Start Diagnostic Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {userName}!
          </h1>
          <p className="text-muted-foreground">Here's your cognitive profile</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white">
            <CardTitle className="text-2xl flex items-center gap-2">
              <Brain className="w-6 h-6" />
              Your Learning Style: {profile.profileType}
            </CardTitle>
            <CardDescription className="text-white/80">
              Based on your diagnostic test performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-success" />
                  <h3 className="font-semibold">Accuracy</h3>
                </div>
                <p className="text-3xl font-bold text-success">
                  {((profile.accuracy || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Questions answered correctly
                </p>
              </div>

              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Avg. Time</h3>
                </div>
                <p className="text-3xl font-bold text-primary">
                  {(profile.avgTime || 0).toFixed(1)}s
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Per question
                </p>
              </div>

              <div className="p-4 bg-card rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-secondary" />
                  <h3 className="font-semibold">Confidence</h3>
                </div>
                <p className="text-3xl font-bold text-secondary">
                  {((profile.avgConfidence || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Average confidence level
                </p>
              </div>
            </div>

            {profile.strengths && profile.strengths.length > 0 && (
              <div className="mt-6 p-4 bg-success/10 rounded-lg border border-success/20">
                <h3 className="font-semibold mb-2 flex items-center gap-2 text-success">
                  <Zap className="w-4 h-4" />
                  Your Strengths
                </h3>
                <ul className="space-y-1">
                  {profile.strengths.map((strength, index) => (
                    <li key={index} className="text-sm">• {strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {profile.areasForImprovement && profile.areasForImprovement.length > 0 && (
              <div className="mt-4 p-4 bg-accent/50 rounded-lg border">
                <h3 className="font-semibold mb-2">Focus Areas</h3>
                <ul className="space-y-1">
                  {profile.areasForImprovement.map((area, index) => (
                    <li key={index} className="text-sm">• {area}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button
            onClick={() => navigate("/dashboard")}
            className="flex-1"
            size="lg"
          >
            Go to Dashboard
          </Button>
          <Button
            onClick={() => navigate("/practice")}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Start Practice
          </Button>
        </div>
      </div>
    </div>
  );
}
