import { ExamManagement } from "@/components/settings/ExamManagement";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Settings() {
  const [weeklyReminder, setWeeklyReminder] = useState(true);

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
      .single();

    const cogProfile = profile?.cognitive_profile as any;
    if (cogProfile?.weeklyReminder !== undefined) {
      setWeeklyReminder(cogProfile.weeklyReminder);
    }
  };

  const handleWeeklyReminderToggle = async (checked: boolean) => {
    setWeeklyReminder(checked);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({
        cognitive_profile: {
          weeklyReminder: checked
        }
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating reminder setting:', error);
      toast.error('Failed to save reminder setting');
      setWeeklyReminder(!checked);
    } else {
      toast.success(checked ? 'Weekly reminders enabled' : 'Weekly reminders disabled');
    }
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="space-y-6">
        <ExamManagement />

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>
              Manage your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="weekly-reminder">Weekly Deep-Dive 12 Reminders</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about weekly calibration sessions
                </p>
              </div>
              <Switch
                id="weekly-reminder"
                checked={weeklyReminder}
                onCheckedChange={handleWeeklyReminderToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}