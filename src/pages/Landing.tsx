import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, Target, TrendingUp, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    // Listen for auth changes
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full gradient-lime-purple flex items-center justify-center">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Abhyas AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="hover:text-lime transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-lime transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-lime transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={handleSignIn}>
              Sign In
            </Button>
            <Button className="gradient-lime-purple text-white" onClick={handleGetStarted}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <GlassCard className="text-center p-12 md:p-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Master Your Exam with{' '}
              <span className="gradient-text">AI-Powered</span>
              <br />
              Adaptive Learning
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Personalized practice that adapts to your learning style. 
              Measure your true capability and improve with intelligent feedback.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="gradient-lime-purple text-white text-lg px-8"
                onClick={handleGetStarted}
              >
                Get Started Free
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-lime text-lg px-8"
                onClick={handleSignIn}
              >
                Sign In
              </Button>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* USP Section */}
      <section id="features" className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl font-bold text-center mb-12">
            Why Choose <span className="gradient-text">Abhyas AI</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <GlassCard className="text-center">
              <div className="w-16 h-16 rounded-full gradient-purple-lavender flex items-center justify-center mx-auto mb-4">
                <Brain className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI-Driven Calibration</h3>
              <p className="text-muted-foreground">
                Measure your true capability with intelligent prompts that adapt to your skill level
              </p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="w-16 h-16 rounded-full gradient-lime-purple flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Adaptive Practice</h3>
              <p className="text-muted-foreground">
                Questions that evolve with your progress, keeping you in the optimal learning zone
              </p>
            </GlassCard>

            <GlassCard className="text-center">
              <div className="w-16 h-16 rounded-full gradient-purple-lavender flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Cognitive Insights</h3>
              <p className="text-muted-foreground">
                Deep analytics on your learning patterns to identify strengths and areas for improvement
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section id="how-it-works" className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <GlassCard className="p-8">
              <h3 className="text-3xl font-bold mb-4 text-destructive">The Problem</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Traditional practice is one-size-fits-all. Students waste time on questions that are too easy or get frustrated with material that's too hard.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>No personalization to your skill level</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>Limited feedback on your thought process</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-destructive">✗</span>
                  <span>No insights into your learning patterns</span>
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-8">
              <h3 className="text-3xl font-bold mb-4 gradient-text">The Solution</h3>
              <p className="text-lg text-muted-foreground mb-4">
                Abhyas AI personalizes every question to your current skill level and provides deep insights into your reasoning process.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-lime">✓</span>
                  <span>Adaptive difficulty that matches your ability</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime">✓</span>
                  <span>Detailed analysis of your justifications</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-lime">✓</span>
                  <span>Cognitive profiling to optimize your learning</span>
                </li>
              </ul>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <GlassCard className="text-center p-12">
            <h2 className="text-4xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of students improving their exam performance with AI
            </p>
            <Button 
              size="lg" 
              className="gradient-lime-purple text-white text-lg px-12"
              onClick={handleGetStarted}
            >
              Start Learning Today
            </Button>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-card border-t py-8">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © 2025 Abhyas AI. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-lime transition-colors">Privacy</a>
              <a href="#" className="hover:text-lime transition-colors">Terms</a>
              <a href="#" className="hover:text-lime transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
