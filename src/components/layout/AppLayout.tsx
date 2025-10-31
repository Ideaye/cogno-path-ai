import { Link, useLocation } from "react-router-dom";
import { Gauge, Target, Zap, ClipboardCheck, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navigation = [
  { icon: Gauge, label: "Dashboard", route: "/dashboard" },
  { icon: Target, label: "Calibration Lab", route: "/calibration" },
  { icon: Zap, label: "Adaptive Practice", route: "/practice" },
  { icon: ClipboardCheck, label: "Mock Tests", route: "/mock-tests" },
  { icon: BarChart3, label: "Insights", route: "/insights" },
  { icon: Settings, label: "Settings", route: "/settings" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [userName, setUserName] = useState("User");
  const [calibrationProgress, setCalibrationProgress] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();
        
        if (profile) setUserName(profile.name);

        const { data: features } = await supabase
          .from('feature_user_daily')
          .select('calibration_progress_0_1')
          .eq('user_id', user.id)
          .order('snapshot_date', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (features) setCalibrationProgress((features.calibration_progress_0_1 || 0) * 100);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-text))] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-white">{userName}</h2>
              <p className="text-xs text-[hsl(var(--sidebar-text))]/70">Abhyas AI</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[hsl(var(--sidebar-text))]/70">
              <span>Calibration Progress</span>
              <span>{Math.round(calibrationProgress)}%</span>
            </div>
            <Progress value={calibrationProgress} className="h-2" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.route;
              const Icon = item.icon;
              return (
                <li key={item.route}>
                  <Link
                    to={item.route}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-[hsl(var(--sidebar-text))]/80 hover:bg-white/5"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
