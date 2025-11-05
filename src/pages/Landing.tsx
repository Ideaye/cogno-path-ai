
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import HeroHeader from '@/components/landing/HeroHeader'; // Assuming this is the new path

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* The new, isolated Hero component will be used here */}
      <HeroHeader />

      {/* You can add other sections like Features, How It Works, etc. here */}
      <main>
        <div id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-accent">Features</h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything you need for exam mastery
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Our platform combines cutting-edge AI with cognitive science to create a learning experience that is effective, engaging, and uniquely yours.
              </p>
            </div>
            {/* Feature content would go here */}
          </div>
        </div>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">&copy; {new Date().getFullYear()} CognoPath AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
