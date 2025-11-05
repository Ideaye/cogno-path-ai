import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { track } from '@/lib/track';
import { LayoutDashboard, Target, Dumbbell, Shield, Settings, GraduationCap } from 'lucide-react';

export default function SideNav({ activeRoute }: { activeRoute: string }) {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      setIsAdmin(profile?.is_admin === true);
    };
    checkAdmin();
  }, []);

  const allItems = [
    { key: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: '/courses', label: 'Courses', icon: GraduationCap },
    { key: '/calibration', label: 'Calibration', icon: Target },
    { key: '/practice', label: 'Practice', icon: Dumbbell },
    { key: '/admin/content', label: 'Admin', icon: Shield, adminOnly: true },
    { key: '/settings', label: 'Settings', icon: Settings },
  ];

  const items = allItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-60 border-r border-border bg-sidebar h-screen p-3">
      <div className="font-semibold mb-4 text-sidebar-foreground text-lg">Abhyas AI</div>
      <nav className="grid gap-1">
        {items.map(i => {
          const Icon = i.icon;
          return (
            <Link 
              key={i.key} 
              to={i.key} 
              onClick={() => track('ui.nav_click', { route: i.key })}
              className={`px-3 py-2 rounded flex items-center gap-2 ${
                activeRoute === i.key 
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' 
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
              }`}
            >
              <Icon size={18} />
              {i.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
