-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule aif-validator to run every 5 minutes
SELECT cron.schedule(
  'aif-validator-every-5min',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url:='https://pfatglhlzflolmgozdiz.supabase.co/functions/v1/aif-validator',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYXRnbGhsemZsb2xtZ296ZGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NjI0MjUsImV4cCI6MjA3NzQzODQyNX0.lqJ3hMBtUYOdEEot2D7SP5Co9W30XYje7_4KxLY5yF0"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);

-- Schedule aif-retune-difficulty to run daily at 02:00 IST (20:30 UTC)
SELECT cron.schedule(
  'aif-retune-difficulty-daily',
  '30 20 * * *',
  $$
  SELECT net.http_post(
    url:='https://pfatglhlzflolmgozdiz.supabase.co/functions/v1/aif-retune-difficulty',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmYXRnbGhsemZsb2xtZ296ZGl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4NjI0MjUsImV4cCI6MjA3NzQzODQyNX0.lqJ3hMBtUYOdEEot2D7SP5Co9W30XYje7_4KxLY5yF0"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id;
  $$
);