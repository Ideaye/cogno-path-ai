
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CollapsibleSideNav } from '@/components/layout/CollapsibleSideNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, User, Lock, LogOut, Edit2, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface EnrolledExam {
  exam_id: string;
  is_active: boolean;
  exams: {
    name: string;
  } | null;
}

export default function ProfileNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [enrollments, setEnrollments] = useState<EnrolledExam[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await loadProfile();
      await loadEnrollments();
      setLoading(false);
    }
    loadData();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
      return;
    }
    setProfile({ name: user.user_metadata.name || '', email: user.email || '' });
  };

  const loadEnrollments = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, is_active, exams(name)')
        .eq('user_id', user.id);

      if (error) throw error;
      setEnrollments(data || []);
    } catch (error) {
      toast.error("Could not load your courses.");
    }
  };

  const handleSetAsActive = async (examId: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('ensure_enrolled_and_set_active', { p_exam_id: examId });
      if (error) throw error;
      toast.success("Active course updated!");
      await loadEnrollments(); // Refresh the list
    } catch (error) {
      toast.error("Failed to update active course.");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full">
        <CollapsibleSideNav />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <CollapsibleSideNav />
      
      <main className="flex-1 p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Sidebar for User Info */}
            <div className="lg:col-span-4">
              <Card className="rounded-2xl p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                   <Avatar className="h-24 w-24 border-2 border-primary">
                     <AvatarImage src="" />
                     <AvatarFallback className="bg-primary/20 text-primary text-3xl font-bold">
                       {profile.name?.[0]?.toUpperCase()}
                     </AvatarFallback>
                   </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold text-black">{profile.name}</h2>
                    <p className="text-sm text-black/70">{profile.email}</p>
                  </div>
                </div>
                <div className="mt-8">
                  <Button onClick={handleSignOut} variant="outline" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Log Out
                  </Button>
                </div>
              </Card>
            </div>

            {/* Main Content for Courses */}
            <div className="lg:col-span-8">
              <Card className="rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold text-black">My Courses</h1>
                    <p className="text-black/70">Manage your enrollments and set your active course.</p>
                  </div>
                  <Button onClick={() => navigate('/courses')}>Add New Course</Button>
                </div>
                
                <div className="space-y-4">
                  {enrollments.length > 0 ? (
                    enrollments.map(enrollment => (
                      <div key={enrollment.exam_id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <BookMarked className="h-5 w-5 text-primary" />
                          <p className="font-semibold text-black">{enrollment.exams?.name || 'Unnamed Course'}</p>
                        </div>
                        <div>
                          {enrollment.is_active ? (
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">Active</Badge>
                          ) : (
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => handleSetAsActive(enrollment.exam_id)}
                              disabled={saving}
                            >
                              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set as Active'}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                     <div className="text-center py-12">
                       <p className="text-lg text-black">You are not enrolled in any courses yet.</p>
                       <Button onClick={() => navigate('/courses')} className="mt-4">Explore Courses</Button>
                     </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
