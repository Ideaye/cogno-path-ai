import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Trash2 } from "lucide-react";

interface Exam {
  id: string;
  name: string;
  level: string;
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

    // Load enrollments
    const { data: enrollmentData } = await supabase
      .from('user_exam_enrollments')
      .select('*, exams(*)')
      .eq('user_id', user.id);

    setEnrollments(enrollmentData || []);

    // Load all available exams
    const { data: examData } = await supabase
      .from('exams')
      .select('*')
      .order('name');

    // Filter out already enrolled exams
    const enrolledIds = enrollmentData?.map(e => e.exam_id) || [];
    const available = examData?.filter(e => !enrolledIds.includes(e.id)) || [];
    setAvailableExams(available);
  };

  const handleSetActive = async (examId: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-exam-enrollment', {
        body: { action: 'set_active', exam_id: examId }
      });

      if (response.error) throw response.error;

      toast.success('Active exam updated');
      loadData();
    } catch (error) {
      console.error('Error setting active exam:', error);
      toast.error('Failed to update active exam');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (examId: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-exam-enrollment', {
        body: { action: 'remove', exam_id: examId }
      });

      if (response.error) throw response.error;

      toast.success('Enrollment removed');
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
      toast.error('Please select an exam');
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke('manage-exam-enrollment', {
        body: { action: 'add', exam_id: selectedExamId }
      });

      if (response.error) throw response.error;

      toast.success('Exam added');
      setSelectedExamId("");
      loadData();
    } catch (error) {
      console.error('Error adding exam:', error);
      toast.error('Failed to add exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Exams</CardTitle>
          <CardDescription>
            Manage your enrolled exams and set which one is currently active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-sm">No exams enrolled yet</p>
          ) : (
            enrollments.map((enrollment) => (
              <div
                key={enrollment.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{enrollment.exams.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {enrollment.exams.level}
                    </div>
                  </div>
                  {enrollment.is_active && (
                    <Badge variant="default" className="ml-2">
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
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Set Active
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemove(enrollment.exam_id)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {availableExams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Another Exam</CardTitle>
            <CardDescription>
              Enroll in additional exams to track progress separately
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {availableExams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} ({exam.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleAddExam} 
              disabled={loading || !selectedExamId}
            >
              Add Exam
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}