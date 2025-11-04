import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, BookOpen, GraduationCap, CheckCircle2, Star } from 'lucide-react';
import { APP_BRAND } from '@/lib/brandConfig';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Exam {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  class_range: string | null;
  admin_only: boolean;
  is_active: boolean;
}

interface ExamSubject {
  exam_id: string;
  subject: string;
  stream: string | null;
}

interface EnrolledExam {
  exam_id: string;
  is_active: boolean;
}

export default function Courses() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Record<string, ExamSubject[]>>({});
  const [enrollments, setEnrollments] = useState<EnrolledExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrollingExam, setEnrollingExam] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Check admin status
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();
      
      setIsAdmin(profile?.is_admin === true);

      // Load exams (public + admin if admin)
      const examsQuery = await (supabase as any)
        .from('exams')
        .select('id, name, slug, category, class_range, admin_only, is_active')
        .eq('is_active', true)
        .order('category')
        .order('name');
      
      const examsData = examsQuery.data;
      const examsError = examsQuery.error;

      if (examsError) throw examsError;
      setExams((examsData || []) as unknown as Exam[]);

      // Load subjects for each exam
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('exam_subjects' as any)
        .select('exam_id, subject, stream');

      if (subjectsError) throw subjectsError;
      
      const subjectsMap: Record<string, ExamSubject[]> = {};
      (subjectsData || []).forEach((s: any) => {
        if (!subjectsMap[s.exam_id]) subjectsMap[s.exam_id] = [];
        subjectsMap[s.exam_id].push({ 
          exam_id: s.exam_id,
          subject: s.subject, 
          stream: s.stream 
        });
      });
      setSubjects(subjectsMap);

      // Load user enrollments
      const { data: enrollData, error: enrollError } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, is_active')
        .eq('user_id', user.id);

      if (enrollError) throw enrollError;
      setEnrollments(enrollData || []);

    } catch (error) {
      console.error('Error loading catalog:', error);
      toast.error('Failed to load course catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (examId: string, examName: string) => {
    setEnrollingExam(examId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if already enrolled
      const existing = enrollments.find(e => e.exam_id === examId);
      if (existing) {
        toast.info('Already enrolled in this course');
        setEnrollingExam(null);
        return;
      }

      // Enroll
      const { error } = await supabase
        .from('user_exam_enrollments')
        .insert({ 
          user_id: user.id, 
          exam_id: examId,
          is_active: enrollments.length === 0 // First enrollment is active
        });

      if (error) throw error;

      toast.success(`Enrolled in ${examName}`);
      await loadCatalog(); // Reload to update UI
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll in course');
    } finally {
      setEnrollingExam(null);
    }
  };

  const handleSetActive = async (examId: string, examName: string) => {
    setEnrollingExam(examId);
    try {
      const { error } = await supabase.rpc('ensure_enrolled_and_set_active', {
        p_exam_id: examId
      });

      if (error) throw error;

      toast.success(`${examName} is now your active course`);
      await loadCatalog();
    } catch (error) {
      console.error('Error setting active:', error);
      toast.error('Failed to set active course');
    } finally {
      setEnrollingExam(null);
    }
  };

  const isEnrolled = (examId: string) => enrollments.some(e => e.exam_id === examId);
  const isActiveExam = (examId: string) => enrollments.some(e => e.exam_id === examId && e.is_active);

  const filteredExams = exams.filter(exam => {
    if (categoryFilter !== 'all' && exam.category && exam.category !== categoryFilter) return false;
    return true;
  });

  const categories = ['Board', 'Engineering', 'Medical', 'Professional'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
            <span className="ml-2 text-black">Loading courses...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black mb-2">
            <GraduationCap className="inline-block mr-3 h-10 w-10" />
            Course Catalog
          </h1>
          <p className="text-lg text-black/70">
            Enroll in courses for Boards and STEM entrances with {APP_BRAND}
          </p>
        </div>

        {/* Category Filter */}
        <Tabs value={categoryFilter} onValueChange={setCategoryFilter} className="mb-6">
          <TabsList className="bg-white/80">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-black">
              All
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger 
                key={cat} 
                value={cat}
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-black"
              >
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {filteredExams.length === 0 ? (
          <Card className="bg-white text-black">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-black/40" />
              <p className="text-lg text-black">No courses in this category</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => {
              const enrolled = isEnrolled(exam.id);
              const active = isActiveExam(exam.id);
              const examSubjects = subjects[exam.id] || [];

              return (
                <Card 
                  key={exam.id} 
                  className={`text-black hover:shadow-lg transition-shadow ${
                    active ? 'bg-purple-50 border-purple-300' : 'bg-white'
                  }`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-black flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          {exam.name}
                          {exam.admin_only && isAdmin && (
                            <Badge variant="secondary" className="ml-2 bg-purple-600 text-white">
                              Admin
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-black/70 mt-1">
                          {exam.category || 'General'} • {exam.class_range || 'All Levels'}
                        </CardDescription>
                      </div>
                      {active && (
                        <Star className="h-5 w-5 text-purple-600 fill-purple-600" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Subjects */}
                    {examSubjects.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-black/60 mb-2">Subjects:</p>
                        <div className="flex flex-wrap gap-1">
                          {examSubjects.slice(0, 4).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-xs text-black border-black/20">
                              {s.subject}
                            </Badge>
                          ))}
                          {examSubjects.length > 4 && (
                            <Badge variant="outline" className="text-xs text-black border-black/20">
                              +{examSubjects.length - 4}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      {!enrolled ? (
                        <Button
                          onClick={() => handleEnroll(exam.id, exam.name)}
                          disabled={enrollingExam === exam.id}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {enrollingExam === exam.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            'Enroll'
                          )}
                        </Button>
                      ) : (
                        <>
                          {active ? (
                            <div className="flex items-center justify-center gap-2 p-2 bg-purple-100 rounded text-purple-700 text-sm font-medium">
                              <CheckCircle2 className="h-4 w-4" />
                              Active Course
                            </div>
                          ) : (
                            <Button
                              onClick={() => handleSetActive(exam.id, exam.name)}
                              disabled={enrollingExam === exam.id}
                              variant="outline"
                              className="w-full text-black border-black/20 hover:bg-purple-50"
                            >
                              {enrollingExam === exam.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Setting...
                                </>
                              ) : (
                                'Set as Active'
                              )}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
