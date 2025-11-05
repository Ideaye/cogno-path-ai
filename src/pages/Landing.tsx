
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, TrendingUp, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { supabase } from '@/integrations/supabase/client';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGetStarted = () => navigate('/auth?mode=signup');
  const handleSignIn = () => navigate('/auth');

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 backdrop-blur-lg bg-background/80">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold">Abhyas AI</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">Features</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">How It Works</a>
            </nav>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSignIn}>Sign In</Button>
              <Button onClick={handleGetStarted}>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            Master Your Exam with{' '}
            <span className="text-primary">AI-Powered</span>{' '}
            Adaptive Learning
          </h1>
          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto">
            Experience the future of exam preparation with intelligent calibration, personalized practice, and cognitive insights that evolve with you.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" onClick={handleGetStarted} className="h-auto transition-all hover:scale-105">
              Start Learning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Unlock Your <span className="text-primary">Potential</span></h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Intelligent features designed to transform how you learn and excel.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            <GlassCard className="p-6 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">AI-Driven Calibration</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Train your confidence alongside knowledge. Our system learns your patterns to optimize both accuracy and self-assessment.
              </p>
            </GlassCard>
            <GlassCard className="p-6 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                <Target className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Adaptive Practice</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Questions that evolve with your progress. Focus on what matters most with AI-selected content tailored to your learning curve.
              </p>
            </GlassCard>
            <GlassCard className="p-6 group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-4">Cognitive Insights</h3>
              <p className="text-base text-muted-foreground leading-relaxed">
                Deep analytics on your learning patterns. Understand your strengths, identify gaps, and track improvement with precision metrics.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">How <span className="text-primary">Abhyas AI</span> Works</h2>
            <p className="text-lg text-muted-foreground">Your path to exam mastery in three simple steps.</p>
          </div>
          <div className="space-y-8">
            <GlassCard className="p-6 flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Calibrate Your Baseline</h3>
                <p className="text-base text-muted-foreground">
                  Start with our intelligent calibration phase that assesses both your knowledge and confidence levels. This creates a personalized learning profile.
                </p>
              </div>
            </GlassCard>
            <GlassCard className="p-6 flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Practice Adaptively</h3>
                <p className="text-base text-muted-foreground">
                  Engage with AI-selected questions that target your weak areas while reinforcing strengths. The difficulty adapts in real-time to your performance.
                </p>
              </div>
            </GlassCard>
            <GlassCard className="p-6 flex items-start gap-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-3">Track & Excel</h3>
                <p className="text-base text-muted-foreground">
                  Monitor your progress with detailed analytics and cognitive insights. Watch your confidence grow as you approach exam-ready mastery.
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 px-6">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Abhyas AI</span>
            </div>
            <p className="text-sm text-muted-foreground text-center sm:text-left">
              © 2025 Abhyas AI. Empowering learners worldwide.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
