import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Trash2, Loader2 } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  slug: string | null;
  category: string | null;
  class_range: string | null;
  admin_only: boolean;
  is_active: boolean;
}

interface Enrollment {
  id: string;
  exam_id: string;
  is_active: boolean;
  exams: Exam;
}

export function ExamManagement() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [availableExams, setAvailableExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check admin status
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = profile?.is_admin === true;

    // Load enrollments (cast to any to bypass type issues)
    const { data: enrollmentData } = await (supabase as any)
      .from('user_exam_enrollments')
      .select('*, exams(*)')
      .eq('user_id', user.id);

    setEnrollments((enrollmentData || []) as Enrollment[]);

    // Load all available exams (cast to any to bypass type issues)
    const { data: examData } = await (supabase as any)
      .from('exams')
      .select('id, name, slug, category, class_range, admin_only, is_active')
      .eq('is_active', true)
      .order('name');

    // Filter out already enrolled exams and admin-only exams (unless user is admin)
    const enrolledIds = enrollmentData?.map(e => e.exam_id) || [];
    const available = (examData || [])
      .filter((e: Exam) => !enrolledIds.includes(e.id))
      .filter((e: Exam) => !e.admin_only || isAdmin);
    setAvailableExams(available);
  };

  const handleSetActive = async (examId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('ensure_enrolled_and_set_active', {
        p_exam_id: examId
      });

      if (error) throw error;

      toast.success('Active course updated');
      loadData();
    } catch (error) {
      console.error('Error setting active exam:', error);
      toast.error('Failed to update active course');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (examId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_exam_enrollments')
        .delete()
        .eq('user_id', user.id)
        .eq('exam_id', examId);

      if (error) throw error;

      toast.success('Course enrollment removed');
      loadData();
    } catch (error) {
      console.error('Error removing enrollment:', error);
      toast.error('Failed to remove enrollment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExam = async () => {
    if (!selectedExamId) {
      toast.error('Please select a course');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if this is the first enrollment
      const isFirstEnrollment = enrollments.length === 0;

      const { error } = await supabase
        .from('user_exam_enrollments')
        .insert({ 
          user_id: user.id, 
          exam_id: selectedExamId,
          is_active: isFirstEnrollment
        });

      if (error) throw error;

      toast.success('Course added successfully');
      setSelectedExamId("");
      loadData();
    } catch (error) {
      console.error('Error adding exam:', error);
      toast.error('Failed to add course');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-black">My Enrolled Courses</CardTitle>
          <CardDescription className="text-black/70">
            Manage your enrolled courses and set which one is currently active for practice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollments.length === 0 ? (
            <p className="text-black/70 text-sm">No courses enrolled yet. Visit the Courses page to enroll.</p>
          ) : (
            enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg bg-background"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium text-black">{enrollment.exams.name}</div>
                    <div className="text-sm text-black/70">
                      {enrollment.exams.category || 'General'} • {enrollment.exams.class_range || 'All Levels'}
                    </div>
                  </div>
                  {enrollment.is_active && (
                    <Badge className="ml-2 bg-purple-600 text-white hover:bg-purple-700">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {!enrollment.is_active && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetActive(enrollment.exam_id)}
                      disabled={loading}
                      className="text-black border-black/20 hover:bg-purple-50"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Set Active
                        </>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(enrollment.exam_id)}
                    disabled={loading}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {availableExams.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-black">Add Another Course</CardTitle>
            <CardDescription className="text-black/70">
              Enroll in additional courses to track progress separately
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger className="flex-1 bg-background border-border text-black">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {availableExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} {exam.category && `(${exam.category})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddExam} 
              disabled={loading || !selectedExamId}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Add Course'
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}