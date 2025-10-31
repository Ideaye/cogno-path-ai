import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ActiveExam {
  exam_id: string | null;
  exam: {
    id: string;
    name: string;
    level: string;
  } | null;
}

export function useActiveExam() {
  const [activeExam, setActiveExam] = useState<ActiveExam | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkActiveExam();
  }, []);

  const checkActiveExam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: enrollment } = await supabase
        .from('user_exam_enrollments')
        .select('exam_id, exams(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (!enrollment) {
        // No active exam, redirect to onboarding
        navigate('/onboarding');
        return;
      }

      setActiveExam({
        exam_id: enrollment.exam_id,
        exam: enrollment.exams as any
      });
    } catch (error) {
      console.error('Error checking active exam:', error);
    } finally {
      setLoading(false);
    }
  };

  return { activeExam, loading, refreshActiveExam: checkActiveExam };
}