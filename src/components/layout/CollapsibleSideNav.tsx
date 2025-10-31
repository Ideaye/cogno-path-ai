import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Target, 
  BookOpen, 
  Shield,
  Menu,
  ChevronLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ProfileSection } from './ProfileSection';
import { NotificationDropdown } from '@/components/NotificationDropdown';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: any;
  label: string;
  route: string;
  adminOnly?: boolean;
}

const navigation: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', route: '/dashboard' },
  { icon: Target, label: 'Calibration', route: '/calibration' },
  { icon: BookOpen, label: 'Practice', route: '/practice' },
  { icon: Shield, label: 'Admin', route: '/admin/content', adminOnly: true },
];

export function CollapsibleSideNav() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    return stored === 'true';
  });
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebar-collapsed', collapsed.toString());
  }, [collapsed]);

  const loadUserData = async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('name, is_admin')
      .eq('id', authUser.id)
      .maybeSingle();

    setUser({
      name: profile?.name || authUser.email?.split('@')[0] || 'User',
      email: authUser.email || '',
    });
    setIsAdmin(profile?.is_admin === true);
  };

  const toggleCollapse = () => setCollapsed(!collapsed);

  const filteredNav = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside 
      className={cn(
        "h-screen flex flex-col transition-all duration-300 border-r border-border/50 bg-white",
        collapsed ? "w-20" : "w-72"
      )}
    >
      {/* Header with toggle */}
      <div className="p-4 flex items-center justify-between border-b border-border/50">
        {!collapsed && (
          <h1 className="text-xl font-bold text-black">Abhyas AI</h1>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="rounded-full text-black hover:bg-black/10"
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.route || 
                          location.pathname.startsWith(item.route + '/');
          
          return (
            <NavLink
              key={item.route}
              to={item.route}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary/20 text-primary font-medium shadow-sm"
                    : "hover:bg-black/5 text-black/70 hover:text-black",
                  collapsed && "justify-center"
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}

        {/* Notification Dropdown */}
        <div className="pt-2 border-t border-border/50 mt-2">
          <NotificationDropdown collapsed={collapsed} />
        </div>
      </nav>

      {/* Profile Section */}
      {user && <ProfileSection collapsed={collapsed} user={user} />}
    </aside>
  );
}
