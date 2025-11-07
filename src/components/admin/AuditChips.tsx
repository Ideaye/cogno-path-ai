import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Run = { jobid: number; jobname: string; status: string; start_time: string; end_time: string };

export default function AuditChips() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.rpc<Run>("get_recent_cron_runs");
      if (error) {
        setErr(error.message);
        return;
      }

      const mapped = (data ?? []).map((r) => ({
        jobid: r.jobid,
        jobname: r.jobname || r.job_name,
        status: r.status,
        start_time: r.start_time,
        end_time: r.end_time,
      }));
      setRuns(mapped);
    })();
  }, []);

  const important = ['aif-validator-every-5min', 'eval-justification-worker', 'compute-anchor-metrics', 'aif-retune-difficulty-daily'];

  const latest = important.map(name => {
    const row = runs.find(r => r.jobname === name);
    return { name, status: row?.status ?? 'n/a', at: row?.start_time ?? '—' };
  });

  return (
    <div className="flex flex-wrap gap-2">
      {latest.map(({ name, status, at }) => (
        <span
          key={name}
          className={
            'px-2 py-1 rounded-full text-xs ' +
            (status === 'succeeded' ? 'bg-green-100 text-green-700' :
             status === 'failed' ? 'bg-red-100 text-red-700' :
             'bg-gray-100 text-gray-700')
          }
          title={`Last run: ${at}`}
        >
          {name} — {status}
        </span>
      ))}
      {err && <span className="text-xs text-red-600">Audit error: {err}</span>}
    </div>
  );
}
