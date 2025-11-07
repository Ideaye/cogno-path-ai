import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { ExamRef } from "@/types/domain";

type ExamDetails = Pick<Database["public"]["Tables"]["exams"]["Row"], "id" | "name" | "level">;
type EnrollmentWithExam = Database["public"]["Tables"]["user_exam_enrollments"]["Row"] & {
  exams: ExamDetails | null;
};

const toExamRef = (enrollment: EnrollmentWithExam): ExamRef => ({
  exam_id: enrollment.exam_id,
  name: enrollment.exams?.name ?? "Unknown",
});

export function useActiveExam() {
  const [activeExam, setActiveExam] = useState<ExamRef | null>(null);
  const [exams, setExams] = useState<ExamRef[]>([]);
  const [loading, setLoading] = useState(true);

  const checkActiveExam = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setActiveExam(null); // CHANGE: No user means no active exam.
        setExams([]); // CHANGE: No user means no enrolled exams.
        setLoading(false);
        return;
      }

      const { data: enrollment } = await supabase
        .from("user_exam_enrollments")
        .select("exam_id, exams(id, name, level)")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (enrollment && enrollment.exams) {
        setActiveExam(toExamRef(enrollment as EnrollmentWithExam));
      } else {
        setActiveExam(null); // CHANGE: No active enrollment means no active exam.
      }

      // Get all exams
      const { data: allEnrollments } = await supabase
        .from("user_exam_enrollments")
        .select("exam_id, exams(id, name)")
        .eq("user_id", user.id)
        .order("created_at");

      if (allEnrollments && allEnrollments.length > 0) {
        setExams(allEnrollments.map((e) => toExamRef(e as EnrollmentWithExam)));
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error("Error checking active exam:", error);
      setActiveExam(null); // On any error, there is no active exam.
      setExams([]); // On any error, there are no exams to show.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkActiveExam();
  }, [checkActiveExam]);

  return { activeExam, exams, loading, refreshActiveExam: checkActiveExam };
}
