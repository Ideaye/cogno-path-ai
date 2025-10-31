import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Exam {
  id: string;
  name: string;
  level: string;
  duration_min: number;
}

export function ExamOnboarding() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error loading exams:', error);
      toast.error('Failed to load exams');
      return;
    }

    setExams(data || []);
  };

  const handleSubmit = async () => {
    if (!selectedExamId) {
      toast.error('Please select an exam');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Check if enrollment already exists
      const { data: existing } = await supabase
        .from('user_exam_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('exam_id', selectedExamId)
        .single();

      if (existing) {
        // Update to active
        await supabase
          .from('user_exam_enrollments')
          .update({ is_active: true })
          .eq('id', existing.id);
      } else {
        // Create new enrollment
        await supabase
          .from('user_exam_enrollments')
          .insert({
            user_id: user.id,
            exam_id: selectedExamId,
            is_active: true
          });
      }

      // Create starter feature row
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('feature_user_exam_daily')
        .insert({
          user_id: user.id,
          exam_id: selectedExamId,
          snapshot_date: today,
          calibration_progress_0_1: 0
        });

      toast.success('Exam enrolled successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll in exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Abhyas AI</CardTitle>
          <CardDescription>
            Calibrate. Practice. Rank up.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Choose your exam</label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>
                    {exam.name} ({exam.level})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !selectedExamId}
            className="w-full"
          >
            {loading ? 'Setting up...' : 'Get Started'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}