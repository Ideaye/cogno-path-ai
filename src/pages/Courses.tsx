import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, BookOpen, GraduationCap } from 'lucide-react';
import { APP_BRAND } from '@/lib/brandConfig';

interface Exam {
  id: string;
  name: string;
  level: string | null;
  duration_min: number | null;
}

export default function Courses() {
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [startingExam, setStartingExam] = useState<string | null>(null);

  useEffect(() => {
    loadPublicExams();
  }, []);

  const loadPublicExams = async () => {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('id, name, level, duration_min')
        .eq('is_admin_only', false)
        .order('name');

      if (error) throw error;
      setExams(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async (examId: string, examName: string) => {
    setStartingExam(examId);
    try {
      const { error } = await supabase.rpc('ensure_enrolled_and_set_active', {
        p_exam_id: examId
      });

      if (error) throw error;

      toast.success(`Started ${examName}`);
      navigate('/calibration');
    } catch (error) {
      console.error('Error starting course:', error);
      toast.error('Failed to start course');
    } finally {
      setStartingExam(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-black" />
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
            Available Courses
          </h1>
          <p className="text-lg text-black/70">
            Choose a course to begin your adaptive learning journey with {APP_BRAND}
          </p>
        </div>

        {exams.length === 0 ? (
          <Card className="bg-white text-black">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-black/40" />
              <p className="text-lg text-black">No courses available yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <Card key={exam.id} className="bg-white text-black hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {exam.name}
                  </CardTitle>
                  {exam.level && (
                    <CardDescription className="text-black/70">
                      Level: {exam.level}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {exam.duration_min && (
                    <p className="text-sm text-black/60 mb-4">
                      Duration: {exam.duration_min} minutes
                    </p>
                  )}
                  <Button
                    onClick={() => handleStart(exam.id, exam.name)}
                    disabled={startingExam === exam.id}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {startingExam === exam.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      'Start Course'
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
