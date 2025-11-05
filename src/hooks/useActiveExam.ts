
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ExamRef } from "@/types/domain";

export function useActiveExam() {
  const [activeExam, setActiveExam] = useState<ExamRef | null>(null);
  const [exams, setExams] = useState<ExamRef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkActiveExam();
  }, []);

  const checkActiveExam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActiveExam(null); // CHANGE: No user means no active exam.
        setExams([]); // CHANGE: No user means no enrolled exams.
        setLoading(false);
        return;
      }

      const { data: enrollment } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, exams(id, name, level)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (enrollment && enrollment.exams) {
        const exam = enrollment.exams as any;
        setActiveExam({
          exam_id: enrollment.exam_id,
          name: exam.name
        });
      } else {
        setActiveExam(null); // CHANGE: No active enrollment means no active exam.
      }

      // Get all exams
      const { data: allEnrollments } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, exams(id, name)')
        .eq('user_id', user.id)
        .order('created_at');

      if (allEnrollments && allEnrollments.length > 0) {
        setExams(allEnrollments.map((e: any) => ({
          exam_id: e.exam_id,
          name: e.exams?.name ?? 'Unknown'
        })));
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error('Error checking active exam:', error);
      setActiveExam(null); // On any error, there is no active exam.
      setExams([]); // On any error, there are no exams to show.
    } finally {
      setLoading(false);
    }
  };

  return { activeExam, exams, loading, refreshActiveExam: checkActiveExam };
}
