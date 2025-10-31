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
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleGetStarted = () => navigate('/auth?mode=signup');
  const handleSignIn = () => navigate('/auth');

  return (
    <div className="min-h-screen bg-background dark">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 border-b border-border/40 backdrop-blur-lg bg-background/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <span className="text-xl sm:text-2xl font-bold">Abhyas AI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-black hover:text-black transition">Features</a>
              <a href="#how-it-works" className="text-sm text-black hover:text-black transition">How It Works</a>
              <a href="#innovation" className="text-sm text-black hover:text-black transition">Innovation</a>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" onClick={handleSignIn} className="text-sm">
                Sign In
              </Button>
              <Button size="sm" onClick={handleGetStarted} className="bg-primary hover:bg-primary-hover text-sm">
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 sm:pt-40 pb-20 sm:pb-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-5xl">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 sm:mb-8">
            Master Your Exam with{' '}
            <span className="text-primary">AI-Powered</span>{' '}
            Adaptive Learning
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-black mb-8 sm:mb-12 max-w-3xl mx-auto font-normal">
            Experience the future of exam preparation with intelligent calibration, 
            personalized practice, and cognitive insights that evolve with you
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-black text-lg px-8 py-6 h-auto transition-all hover:scale-105 font-medium"
            >
              Start Learning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleSignIn}
              className="w-full sm:w-auto text-lg px-8 py-6 h-auto border-2"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Unlock Your <span className="text-primary">Potential</span>
            </h2>
            <p className="text-lg sm:text-xl text-black max-w-2xl mx-auto font-normal">
              Intelligent features designed to transform how you learn and excel
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
            <GlassCard className="p-6 sm:p-8 group hover:shadow-md transition-all animate-fade-in">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">AI-Driven Calibration</h3>
              <p className="text-sm sm:text-base text-black leading-relaxed font-normal">
                Train your confidence alongside knowledge. Our system learns your 
                patterns to optimize both accuracy and self-assessment
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 group hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Adaptive Practice</h3>
              <p className="text-sm sm:text-base text-black leading-relaxed font-normal">
                Questions that evolve with your progress. Focus on what matters 
                most with AI-selected content tailored to your learning curve
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 group hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition">
                <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Cognitive Insights</h3>
              <p className="text-sm sm:text-base text-black leading-relaxed font-normal">
                Deep analytics on your learning patterns. Understand your strengths,
                identify gaps, and track improvement with precision metrics
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 group hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition">
                <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Real-Time Feedback</h3>
              <p className="text-sm sm:text-base text-black leading-relaxed font-normal">
                Instant insights after every question. Learn from mistakes 
                immediately with AI-generated explanations and improvement tips
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 group hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition">
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Progress Tracking</h3>
              <p className="text-sm sm:text-base text-black leading-relaxed font-normal">
                Visualize your journey to mastery. Comprehensive dashboards 
                show your growth across topics, time, and confidence levels
              </p>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 group hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition">
                <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4">Smart Reviews</h3>
              <p className="text-sm sm:text-base text-black leading-relaxed font-normal">
                Never forget what you've learned. Spaced repetition powered by
                AI ensures long-term retention and exam-day confidence
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Innovation Section */}
      <section id="innovation" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-6 sm:mb-8">
            <span className="text-primary">Innovation</span> is central to our ethos.
            Advanced technologies and adaptive algorithms work together to 
            revolutionize how you prepare for exams
          </h2>
          <p className="text-lg sm:text-xl text-black leading-relaxed font-normal">
            We combine cutting-edge machine learning, cognitive science, and educational 
            psychology to create a learning experience that's uniquely yours
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              How <span className="text-primary">Abhyas AI</span> Works
            </h2>
            <p className="text-lg sm:text-xl text-black">
              Your path to exam mastery in three simple steps
            </p>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl font-bold text-primary">1</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">Calibrate Your Baseline</h3>
                <p className="text-sm sm:text-base text-black font-normal">
                  Start with our intelligent calibration phase that assesses both your knowledge 
                  and confidence levels. This creates a personalized learning profile
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl font-bold text-primary">2</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">Practice Adaptively</h3>
                <p className="text-sm sm:text-base text-black font-normal">
                  Engage with AI-selected questions that target your weak areas while 
                  reinforcing strengths. The difficulty adapts in real-time to your performance
                </p>
              </div>
            </GlassCard>

            <GlassCard className="p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 hover:shadow-md transition-all">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl sm:text-3xl font-bold text-primary">3</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 sm:mb-3">Track & Excel</h3>
                <p className="text-sm sm:text-base text-black font-normal">
                  Monitor your progress with detailed analytics and cognitive insights. 
                  Watch your confidence grow as you approach exam-ready mastery
                </p>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto text-center max-w-4xl">
          <GlassCard className="p-8 sm:p-12 md:p-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
              Ready to <span className="text-primary">Transform</span> Your Learning?
            </h2>
            <p className="text-lg sm:text-xl text-black mb-6 sm:mb-8 max-w-2xl mx-auto">
              Join thousands of students who are already mastering their exams 
              with AI-powered adaptive learning
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-primary hover:bg-primary-hover text-black text-lg px-8 sm:px-12 py-6 h-auto transition-all hover:scale-105 font-medium"
            >
              Start Learning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold">Abhyas AI</span>
            </div>
            <p className="text-sm text-black text-center sm:text-left">
              © 2025 Abhyas AI. Empowering learners worldwide.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-black hover:text-black transition">Privacy</a>
              <a href="#" className="text-sm text-black hover:text-black transition">Terms</a>
              <a href="#" className="text-sm text-black hover:text-black transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
