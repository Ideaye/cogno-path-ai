import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Download, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ProfileSectionProps {
  collapsed: boolean;
  user: {
    name: string;
    email: string;
  };
}

export function ProfileSection({ collapsed, user }: ProfileSectionProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({ title: 'Signed out successfully' });
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error signing out',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReport = async () => {
    setDownloading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('generate-weekly-report', {
        body: { user_id: authUser.id }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast({ title: 'Report downloaded' });
      }
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: 'Failed to download report',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const menuContent = (
    <div className="space-y-3">
      {!collapsed && (
        <>
          <div className="flex items-center gap-3">
            <Avatar className="ring-2 ring-lime">
              <AvatarFallback className="gradient-lime-purple text-white font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <Separator />
        </>
      )}
      
      <nav className="space-y-1">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => navigate('/profile')}
        >
          <User className="mr-2 h-4 w-4" />
          {!collapsed && 'My Profile'}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => navigate('/settings')}
        >
          <Settings className="mr-2 h-4 w-4" />
          {!collapsed && 'Settings'}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={handleDownloadReport}
          disabled={downloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {!collapsed && (downloading ? 'Downloading...' : 'Download Report')}
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {!collapsed && 'Sign Out'}
        </Button>
      </nav>
    </div>
  );

  if (collapsed) {
    return (
      <div className="border-t border-border/50 p-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="w-full rounded-full">
              <Avatar className="ring-2 ring-lime h-10 w-10">
                <AvatarFallback className="gradient-lime-purple text-white font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent side="right" className="glass-card w-64 p-4">
            {menuContent}
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return (
    <div className="border-t border-border/50 p-4">
      {menuContent}
    </div>
  );
}
