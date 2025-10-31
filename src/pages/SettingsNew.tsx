import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/track';
import SideNav from '@/components/SideNav';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function SettingsNew() {
  const [enabled, setEnabled] = useState(true);

  useEffect(() => { 
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('cognitive_profile')
        .eq('id', user.id)
        .maybeSingle();
        
      const cog = (profile?.cognitive_profile as any) ?? {};
      if (cog.weeklyReminder !== undefined) setEnabled(cog.weeklyReminder);
    })(); 
  }, []);

  const save = async (v: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('cognitive_profile')
      .eq('id', user.id)
      .maybeSingle();

    const currentProfile = (profile?.cognitive_profile as any) || {};
    
    await supabase
      .from('profiles')
      .update({ 
        cognitive_profile: {
          ...currentProfile,
          weeklyReminder: v 
        }
      })
      .eq('id', user.id);
      
    track('settings.toggle.weekly_reminder', { enabled: v });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SideNav activeRoute="/settings" />
      <main className="flex-1 p-6">
        <div className="text-2xl font-semibold mb-6">Settings</div>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-reminder">Weekly Deep-Dive 12 Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about weekly calibration sessions
              </p>
            </div>
            <Switch 
              id="weekly-reminder"
              checked={enabled} 
              onCheckedChange={(v) => { 
                setEnabled(v); 
                save(v); 
              }}
            />
          </div>
        </Card>
      </main>
    </div>
  );
}
