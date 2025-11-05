
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GlassCard } from "@/components/ui/glass-card";
import { useToast } from "@/hooks/use-toast";
import { Brain, Loader2, Mail, Smartphone, ArrowLeft, BookOpen } from "lucide-react";
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
  
  // NEW: State for exams and selected exam
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExam, setSelectedExam] = useState<string | null>(null);

  useEffect(() => {
    // Check if already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // NEW: Fetch public exams for the dropdown
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
        console.error('Error loading courses for signup:', error);
        toast.error("Could not load courses. Please refresh.");
      }
    };
    loadPublicExams();
  }, [navigate, toast]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });
        navigate('/dashboard');
      } else {
        // NEW: Ensure an exam is selected
        if (!selectedExam) {
          toast({ title: "Please select a course to continue.", variant: "destructive" });
          setLoading(false);
          return;
        }

        const redirectUrl = `${window.location.origin}/dashboard`;
        
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            // NEW: Pass name and selected exam ID
            data: { name, active_exam_id: selectedExam },
            emailRedirectTo: redirectUrl
          },
        });

        if (error) throw error;

        if (data.session) {
          toast({
            title: "Welcome!",
            description: "Account created successfully.",
          });
          navigate('/dashboard');
        } else {
          toast({
            title: "Account created!",
            description: "Please check your email to verify your account.",
          });
        }
      }
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

  const handleSocialAuth = async (provider: 'google' | 'apple') => {
    // Social auth doesn't support mandatory course selection on day one.
    // We will handle this in the onboarding flow later.
    toast({ title: "Coming Soon!", description: "Please sign up with email for now." });
  };

  // ... (rest of the functions for OTP remain the same)

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4 sm:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 sm:top-8 sm:left-8"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <GlassCard className="w-full max-w-md">
        <div className="p-4 sm:p-6 space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center mx-auto mb-4">
              <Brain className="h-7 w-7 sm:h-8 sm:w-8 text-black" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Abhyas AI</h1>
            <p className="text-sm sm:text-base text-black">
              {isLogin ? 'Welcome back!' : 'Start your learning journey'}
            </p>
          </div>

          {/* Social Auth Buttons (Now disabled for this flow) */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => handleSocialAuth('google')}
              disabled={true} // Social auth disabled for now
            >
               <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">...</svg>
              Continue with Google
            </Button>
          </div>

          <div className="relative">...</div>

          {/* Email/Password Form */}
          {authMethod === 'email' && !isLogin && (
            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password (min. 6 characters)</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </div>

              {/* NEW: Course Selection Dropdown */}
              <div className="space-y-2">
                <Label htmlFor="exam">Choose your course</Label>
                <Select onValueChange={setSelectedExam} required>
                  <SelectTrigger id="exam" className="w-full">
                    <SelectValue placeholder="Select a course..." />
                  </SelectTrigger>
                  <SelectContent>
                    {exams.length === 0 ? (
                      <SelectItem value="loading" disabled>Loading courses...</SelectItem>
                    ) : (
                      exams.map(exam => (
                        <SelectItem key={exam.id} value={exam.id}>
                          {exam.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password || !name || !selectedExam}
                className="w-full bg-primary hover:bg-primary-hover text-black"
                size="lg"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>
            </form>
          )}

          {/* Rest of the component for login, OTP, etc. */}
          {/* ... */}
        </div>
      </GlassCard>
    </div>
  );
}
