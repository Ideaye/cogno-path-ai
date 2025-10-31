import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, Download, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
  const [open, setOpen] = useState(false);

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
    <div className="space-y-2 w-full">
      <div className="flex items-center gap-3 px-2 py-3">
        <Avatar className="ring-2 ring-highlight">
          <AvatarFallback className="bg-highlight text-foreground font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <Separator />
      
      <nav className="space-y-1 px-1">
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => {
            setOpen(false);
            navigate('/profile');
          }}
        >
          <User className="mr-2 h-4 w-4" />
          My Profile
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={() => {
            setOpen(false);
            navigate('/settings');
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
        <Button 
          variant="ghost" 
          className="w-full justify-start"
          onClick={handleDownloadReport}
          disabled={downloading}
        >
          <Download className="mr-2 h-4 w-4" />
          {downloading ? 'Downloading...' : 'Download Report'}
        </Button>
        <Separator className="my-2" />
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </nav>
    </div>
  );

  return (
    <div className="border-t border-border/50 p-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            className={cn(
              "w-full justify-start hover:bg-muted/20 transition-all",
              collapsed ? "px-0 justify-center" : "px-3"
            )}
          >
            <Avatar className={cn("ring-2 ring-highlight", collapsed ? "h-10 w-10" : "h-9 w-9")}>
              <AvatarFallback className="bg-highlight text-foreground font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 text-left ml-3 min-w-0">
                <p className="font-medium truncate text-sm">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          side={collapsed ? "right" : "top"} 
          align={collapsed ? "start" : "center"}
          className="w-64 p-3 bg-white border border-black/[0.08] shadow-md"
        >
          {menuContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}
