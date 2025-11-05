tsx
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Mail, ArrowLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Exam {
  id: string;
  name: string;
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    const loadPublicExams = async () => {
      try {
        const { data, error } = await supabase
          .from('exams')
          .select('id, name')
          .eq('is_admin_only', false)
          .order('name');
        if (error) throw error;
        setExams(data || []);
      } catch (error) {
        toast({
            title: "Error",
            description: "Could not load courses to select.",
            variant: "destructive"
        });
      }
    };
    loadPublicExams();
  }, [navigate, toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "Successfully signed in." });
        navigate('/dashboard');
      } else {
        if (!selectedExam) {
          toast({ title: "Please select a course to continue.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name, active_exam_id: selectedExam } },
        });
        if (error) throw error;
        if (data.session) {
          toast({ title: "Welcome!", description: "Account created successfully." });
          navigate('/dashboard');
        } else {
          toast({ title: "Account created!", description: "Please check your email to verify your account." });
        }
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // THE CORRECTED CODE:
    const handleSocialAuth = async (provider: 'google' | 'apple') => {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithOAuth({ provider });
        if (error) throw error;
      } catch (error: any) { // THE MISSING BRACE IS NOW HERE
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setLoading(false);
      }
    };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Button variant="ghost" size="sm" className="absolute top-4 left-4" onClick={() => navigate('/')}>
        <ArrowLeft className="h-4 w-4 mr-2" /> Back
      </Button>
      <GlassCard className="w-full max-w-md">
        <div className="p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-black">Abhyas AI</h1>
            <p className="text-base text-black/80">{isLogin ? 'Welcome back!' : 'Start your learning journey'}</p>
          </div>

          <div className="space-y-3">
            <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialAuth('google')} disabled={loading}>Continue with Google</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialAuth('apple')} disabled={loading}>Continue with Apple</Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-black">Or continue with email</span>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required disabled={loading} />
                  </div>
                   <div className="space-y-2">
                     <Label htmlFor="exam">Choose your course</Label>
                     <Select onValueChange={setSelectedExam} required>
                       <SelectTrigger id="exam"><SelectValue placeholder="Select a course..." /></SelectTrigger>
                       <SelectContent>
                         {exams.map(exam => <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>)}
                       </SelectContent>
                     </Select>
                   </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} disabled={loading} />
              </div>
              <Button type="submit" disabled={loading || (!isLogin && (!name || !selectedExam))} className="w-full bg-primary hover:bg-primary-hover text-black" size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

          <div className="text-center text-sm">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline" disabled={loading}>
              {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>

        </div>
      </GlassCard>
    </div>
  );
}