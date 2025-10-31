import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/track';
import SideNav from '@/components/SideNav';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function SettingsNew() {
  const { toast } = useToast();
  const [dailyEmail, setDailyEmail] = useState(false);
  const [weeklyPdf, setWeeklyPdf] = useState(false);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);

  useEffect(() => { 
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('cognitive_profile')
      .eq('id', user.id)
      .maybeSingle();
      
    const cog = (profile?.cognitive_profile as any) ?? {};
    const prefs = cog.report_prefs ?? {};
    
    setDailyEmail(prefs.daily_email === true);
    setWeeklyPdf(prefs.weekly_pdf === true);

    // Get linked identities
    const { data: { identities } } = await supabase.auth.getUserIdentities();
    setLinkedProviders(identities?.map(i => i.provider) ?? []);
  };

  const savePreference = async (key: string, value: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('cognitive_profile')
      .eq('id', user.id)
      .maybeSingle();

    const currentProfile = (profile?.cognitive_profile as any) || {};
    const reportPrefs = currentProfile.report_prefs || {};
    
    await supabase
      .from('profiles')
      .update({ 
        cognitive_profile: {
          ...currentProfile,
          report_prefs: {
            ...reportPrefs,
            [key]: value
          }
        }
      })
      .eq('id', user.id);
      
    track(`settings_toggle_${key}`, { enabled: value });
    toast({ title: 'Preference saved' });
  };

  const linkIdentity = async (provider: 'google' | 'apple') => {
    try {
      const { error } = await supabase.auth.linkIdentity({ provider });
      if (error) throw error;
      
      toast({ title: `${provider} account linked` });
      track(`account_link_${provider}_clicked`);
      loadSettings();
    } catch (error: any) {
      console.error('Link error:', error);
      toast({ 
        title: 'Failed to link account', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/settings" />
      <main className="flex-1 p-6 space-y-6">
        <div className="text-2xl font-semibold">Settings</div>

        <Card className="p-6 space-y-4">
          <div className="text-lg font-medium">Report Preferences</div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="daily-email">Daily Email Summary</Label>
              <p className="text-sm text-muted-foreground">
                Receive daily progress summaries via email
              </p>
            </div>
            <Switch 
              id="daily-email"
              checked={dailyEmail} 
              onCheckedChange={(v) => { 
                setDailyEmail(v); 
                savePreference('daily_email', v); 
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-pdf">Weekly PDF Report</Label>
              <p className="text-sm text-muted-foreground">
                Get weekly performance reports as PDF via email
              </p>
            </div>
            <Switch 
              id="weekly-pdf"
              checked={weeklyPdf} 
              onCheckedChange={(v) => { 
                setWeeklyPdf(v); 
                savePreference('weekly_pdf', v); 
              }}
            />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="text-lg font-medium">Account Connections</div>
          <p className="text-sm text-muted-foreground">
            Link additional login methods to your account
          </p>

          <div className="space-y-2">
            {!linkedProviders.includes('google') && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => linkIdentity('google')}
              >
                Link Google Account
              </Button>
            )}
            {linkedProviders.includes('google') && (
              <div className="p-3 border rounded bg-muted/30 text-sm">
                ✓ Google account linked
              </div>
            )}

            {!linkedProviders.includes('apple') && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => linkIdentity('apple')}
              >
                Link Apple Account
              </Button>
            )}
            {linkedProviders.includes('apple') && (
              <div className="p-3 border rounded bg-muted/30 text-sm">
                ✓ Apple account linked
              </div>
            )}
          </div>
        </Card>
      </main>
    </div>
  );
}
