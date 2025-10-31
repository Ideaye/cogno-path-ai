import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Stats } from '@/types/domain';
import { mock } from '@/lib/mock';

export function useDashboardData(exam_id?: string) {
  const [stats, setStats] = useState<Stats>({ ...mock.stats });
  const [weaknesses, setWeaknesses] = useState(mock.weaknesses);

  useEffect(() => {
    if (!exam_id) return;
    
    const fetchData = async () => {
      try {
        // TODO: Implement real data fetching
        // For now, using mock data as safe fallback
        console.log('Fetching dashboard data for exam:', exam_id);
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        setStats({ ...mock.stats });
        setWeaknesses(mock.weaknesses);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setStats({ ...mock.stats });
        setWeaknesses(mock.weaknesses);
      }
    };

    fetchData();
  }, [exam_id]);

  return { stats, weaknesses };
}
