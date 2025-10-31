import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardData {
  loading: boolean;
  practice: {
    total: number;
    correct: number;
    accuracy: number;
    avgTimeMs: number;
    streak: number;
    recent: Array<{ id: string; correct: boolean; created_at: string }>;
  };
  cdna: {
    ece: number | null;
    anchorMean: number | null;
    anchorStd: number | null;
    version: string | null;
    source: string | null;
  };
  calibration: {
    progress: number;
  };
  reports: {
    weeklyUrl: string | null;
  };
}

export function useDashboardData(exam_id?: string): DashboardData {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData>({
    loading: true,
    practice: { total: 0, correct: 0, accuracy: 0, avgTimeMs: 0, streak: 0, recent: [] },
    cdna: { ece: null, anchorMean: null, anchorStd: null, version: null, source: null },
    calibration: { progress: 0 },
    reports: { weeklyUrl: null },
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch attempts from last 30 days
        const since = new Date();
        since.setDate(since.getDate() - 30);

        const { data: attempts } = await supabase
          .from('attempts')
          .select('id,correct,time_taken_ms,created_at')
          .eq('user_id', user.id)
          .gte('created_at', since.toISOString())
          .order('created_at', { ascending: false })
          .limit(200);

        const total = attempts?.length ?? 0;
        const correct = attempts?.filter((a) => a.correct).length ?? 0;
        const accuracy = total ? Math.round((correct / total) * 100) : 0;
        const avgTimeMs = total
          ? Math.round(attempts!.reduce((s, a) => s + (a.time_taken_ms || 0), 0) / total)
          : 0;
        const recent = (attempts ?? []).slice(0, 10);

        // Calculate streak (consecutive days with attempts)
        const days = new Set((attempts ?? []).map((a) => new Date(a.created_at).toDateString()));
        let streak = 0;
        let d = new Date();
        while (days.has(d.toDateString())) {
          streak++;
          d.setDate(d.getDate() - 1);
        }

        // Fetch CDNA metrics if exam_id exists
        let ece = null, anchorMean = null, anchorStd = null, version = null, source = null;
        let progress = 0;

        if (exam_id) {
          const { data: feat } = await supabase
            .from('feature_user_exam_daily')
            .select('ece_0_1,anchor_score_mean,anchor_score_std,calibration_progress_0_1')
            .eq('user_id', user.id)
            .eq('exam_id', exam_id)
            .order('snapshot_date', { ascending: false })
            .limit(1);

          if (feat && feat[0]) {
            ece = feat[0].ece_0_1;
            anchorMean = feat[0].anchor_score_mean;
            anchorStd = feat[0].anchor_score_std;
            progress = feat[0].calibration_progress_0_1 ?? 0;
          }

          const { data: ver } = await supabase
            .from('cdna_versions')
            .select('version,source')
            .eq('user_id', user.id)
            .eq('exam_id', exam_id)
            .order('created_at', { ascending: false })
            .limit(1);

          if (ver && ver[0]) {
            version = ver[0].version;
            source = ver[0].source;
          }
        }

        // Fetch latest weekly report
        let weeklyUrl: string | null = null;
        const { data: rep } = await supabase
          .from('calibration_reports')
          .select('storage_path')
          .eq('user_id', user.id)
          .eq('report_type', 'weekly')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (rep?.storage_path) {
          const { data: signed } = await supabase.storage
            .from('reports')
            .createSignedUrl(rep.storage_path, 60 * 60); // 1 hour
          weeklyUrl = signed?.signedUrl ?? null;
        }

        setData({
          loading: false,
          practice: { total, correct, accuracy, avgTimeMs, streak, recent },
          cdna: { ece, anchorMean, anchorStd, version, source },
          calibration: { progress },
          reports: { weeklyUrl },
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (exam_id) {
      fetchData();
    }
  }, [exam_id]);

  return { ...data, loading };
}
