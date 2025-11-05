
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Mail, Smartphone, ArrowLeft } from "lucide-react";
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
  const [authMethod, setAuthMethod] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
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
        toast.error("Could not load courses.");
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

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };
  
  // ... (OTP functions are unchanged) ...
  const handleSendOTP = async () => { /* ... */ };
  const handleVerifyOTP = async (e: React.FormEvent) => { /* ... */ };

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
            <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialAuth('google')} disabled={loading}>...</Button>
            <Button type="button" variant="outline" className="w-full" onClick={() => handleSocialAuth('apple')} disabled={loading}>...</Button>
          </div>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-black">Or continue with</span>
          </div>

          <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
            <button type="button" onClick={() => setAuthMethod('email')} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${authMethod === 'email' ? 'bg-background shadow-sm' : 'text-black/70 hover:text-black'}`}>
              <Mail className="w-4 h-4 inline mr-1" /> Email
            </button>
            <button type="button" onClick={() => setAuthMethod('otp')} className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${authMethod === 'otp' ? 'bg-background shadow-sm' : 'text-black/70 hover:text-black'}`}>
              <Smartphone className="w-4 h-4 inline mr-1" /> Phone
            </button>
          </div>

          {authMethod === 'email' && (
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
              <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary-hover text-black" size="lg">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>
          )}
          
          {authMethod === 'otp' && ( /* ... OTP form ... */ )}

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
