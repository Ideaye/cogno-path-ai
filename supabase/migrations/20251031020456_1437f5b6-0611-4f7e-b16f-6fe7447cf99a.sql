-- Update cron jobs for CDNA Rigor Pack v0.4

-- Schedule compute-anchor-metrics nightly at 02:10 IST (20:40 UTC)
SELECT cron.schedule(
  'compute-anchor-metrics-nightly',
  '40 20 * * *',
  $$
  SELECT net.http_post(
    url:='https://pfatglhlzflolmgozdiz.supabase.co/functions/v1/compute-anchor-metrics',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYXRnbGhsemZsb2xtZ296ZGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NjI0MjUsImV4cCI6MjA3NzQzODQyNX0.lqJ3hMBtUYOdEEot2D7SP5Co9W30XYje7_4KxLY5yF0"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);