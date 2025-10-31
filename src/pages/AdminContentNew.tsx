import { supabase } from '@/integrations/supabase/client';
import SideNav from '@/components/SideNav';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

const MARKETING_EXAM_ID = '3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31';
const ADMIN_EMAIL = 'pranav.n@ideaye.in';

export default function AdminContentNew() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single();

      setIsAdmin(profile?.email === ADMIN_EMAIL);
    } catch (error) {
      console.error('Error checking admin:', error);
    } finally {
      setLoading(false);
    }
  }

  const generate = async () => {
    await supabase.functions.invoke('aif-generate', { 
      body: { exam_id: 'cat', count: 20, difficulty: 'medium' }
    });
  };
  
  const approve = async () => {
    await supabase.functions.invoke('aif-approve', { 
      body: { ids: [], min_quality: 0.7 }
    });
  };

  const seedMarketingCourse = async () => {
    setSeeding(true);
    try {
      // Re-seed practice items
      await supabase.from('practice_items').delete().eq('exam_id', MARKETING_EXAM_ID);
      
      const practiceItems = [
        { exam_id: MARKETING_EXAM_ID, stem: 'Which metric best indicates efficiency of paid acquisition over time?', choices: '["CAC","LTV","CTR","Impressions"]', correct_answer: 'CAC', tags: ['acquisition','metrics'], difficulty: 2 },
        { exam_id: MARKETING_EXAM_ID, stem: 'A campaign has CAC ₹800, average order value ₹2,500, gross margin 40%, 20% repeat rate. Rough LTV:CAC ratio target for sustainability?', choices: null, correct_answer: '>=3:1', tags: ['unit-economics','ltv'], difficulty: 3 },
        { exam_id: MARKETING_EXAM_ID, stem: 'For an A/B test, minimum detectable effect goes down when you…', choices: '["Lower sample size","Increase variance","Increase sample size","Shorten test"]', correct_answer: 'Increase sample size', tags: ['experimentation'], difficulty: 2 },
        { exam_id: MARKETING_EXAM_ID, stem: 'Define a crisp positioning statement for a premium Apple reseller in 15–25 words.', choices: null, correct_answer: null, tags: ['positioning','brand'], difficulty: 3 },
        { exam_id: MARKETING_EXAM_ID, stem: 'What is the primary goal of a TOFU campaign in a full-funnel plan?', choices: '["Sales","Awareness","Retention","Support"]', correct_answer: 'Awareness', tags: ['funnel'], difficulty: 1 },
        { exam_id: MARKETING_EXAM_ID, stem: 'Pick the MOST actionable segmentation axis for store-level geo campaigns:', choices: '["Age","Pin code cluster","Zodiac sign","Browser"]', correct_answer: 'Pin code cluster', tags: ['segmentation','geo'], difficulty: 1 },
        { exam_id: MARKETING_EXAM_ID, stem: 'Name 3 signals to build a churn-risk audience from CRM.', choices: null, correct_answer: null, tags: ['crm','retention'], difficulty: 4 },
        { exam_id: MARKETING_EXAM_ID, stem: 'You see high CTR, low CVR on Meta. First diagnostic step?', choices: '["Increase budget","Pause ads","Check landing speed & match","Change product price"]', correct_answer: 'Check landing speed & match', tags: ['diagnostics','performance'], difficulty: 2 },
        { exam_id: MARKETING_EXAM_ID, stem: 'Define north-star metric for a new store launch campaign (one line).', choices: null, correct_answer: null, tags: ['north-star'], difficulty: 2 },
        { exam_id: MARKETING_EXAM_ID, stem: 'In a remarketing window test (7 vs 30 days), what artifact could inflate 30-day performance?', choices: '["Creative wearout","Attribution overlap","Frequency cap","Audience size"]', correct_answer: 'Attribution overlap', tags: ['remarketing','measurement'], difficulty: 3 }
      ];

      const { error: practiceError } = await supabase.from('practice_items').insert(practiceItems);
      if (practiceError) throw practiceError;

      // Re-seed calibration items
      await supabase.from('calibration_items').delete().eq('exam_id', MARKETING_EXAM_ID);

      const calibrationItems = [
        { exam_id: MARKETING_EXAM_ID, prompt: 'Design a quick GTM for a weekend store event to lift Mac footfalls by 15% in 10 days.' },
        { exam_id: MARKETING_EXAM_ID, prompt: 'You must cut Meta CAC by 25% without dropping weekly sales. Outline experiments.' },
        { exam_id: MARKETING_EXAM_ID, prompt: 'Create a pin-code clustering approach for Hyderabad to prioritize OOH + local influencers.' },
        { exam_id: MARKETING_EXAM_ID, prompt: 'Draft an email subject + preheader to upsell iPhone Pro users into Mac (cross-sell).' },
        { exam_id: MARKETING_EXAM_ID, prompt: 'Pick top 3 KPIs to evaluate a festive TAAM sale across iPhone/Mac and justify.' },
        { exam_id: MARKETING_EXAM_ID, prompt: 'Propose a weekly CRM plan to win back high-value lapsed customers in 30 days.' }
      ];

      const { error: calibrationError } = await supabase.from('calibration_items').insert(calibrationItems);
      if (calibrationError) throw calibrationError;

      toast({
        title: 'Success',
        description: 'Marketing course items reloaded successfully'
      });
    } catch (error) {
      console.error('Error seeding:', error);
      toast({
        title: 'Error',
        description: 'Failed to reload items',
        variant: 'destructive'
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full bg-background items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/admin/content" />
      <main className="flex-1 p-6">
        <div className="text-2xl font-semibold mb-6">Admin – Content Ops</div>
        <Card className="p-6 mb-6">
          <div className="space-y-3">
            <Button onClick={generate}>Generate Content</Button>
            <Button variant="outline" onClick={approve}>Approve (≥0.7)</Button>
          </div>
        </Card>

        {isAdmin && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Marketing Course Management</h3>
            <p className="text-sm text-foreground mb-4">
              Reload the sample Marketing Fundamentals course items (10 practice + 6 calibration)
            </p>
            <Button 
              onClick={seedMarketingCourse} 
              disabled={seeding}
              variant="secondary"
            >
              {seeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reloading...
                </>
              ) : (
                'Reload Marketing Items'
              )}
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
}
