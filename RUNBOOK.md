# Abhyas AI - Implementation Runbook

## Environment Variables

### Required for Edge Functions

Set these in your Supabase project settings under Edge Functions:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_URL=https://your-app-domain.com
RESEND_API_KEY=re_your_resend_api_key (optional for email sending)
```

### Auto-configured (already set)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Database Setup

### 1. Create Storage Bucket

Go to Storage in Supabase dashboard and create a bucket named `reports` with:
- Public: **No** (private bucket)
- File size limit: 10MB (recommended)
- Allowed MIME types: `application/pdf`

### 2. Enable Auth Providers

In Authentication > Providers, enable:
- Google OAuth
- Apple OAuth  
- Phone (OTP)

### 3. Schedule Cron Jobs

Run these SQL commands in the SQL Editor (replace `YOUR_FUNCTIONS_URL` with your actual functions URL, e.g., `https://your-project.supabase.co/functions/v1`):

```sql
-- Daily summary email: 20:15 IST (14:45 UTC)
SELECT cron.schedule(
  'send-daily-summary',
  '45 14 * * *',
  $$
    SELECT net.http_post(
      url := 'YOUR_FUNCTIONS_URL/send-daily-summary',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);

-- Weekly report generation: every Sunday 20:20 IST (14:50 UTC)
SELECT cron.schedule(
  'generate-weekly-report-batch',
  '50 14 * * 0',
  $$
    SELECT net.http_post(
      url := 'YOUR_FUNCTIONS_URL/generate-weekly-report',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body := '{"user_id": "' || id::text || '"}'
    ) AS request_id
    FROM auth.users;
  $$
);

-- Weekly report email: every Sunday 20:30 IST (15:00 UTC)
SELECT cron.schedule(
  'send-weekly-report',
  '0 15 * * 0',
  $$
    SELECT net.http_post(
      url := 'YOUR_FUNCTIONS_URL/send-weekly-report',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) AS request_id;
  $$
);
```

### 4. Set Admin User

Already handled by migration, but you can verify:

```sql
UPDATE public.profiles
SET is_admin = true
WHERE email = 'pranav.n@ideaye.in';
```

## Local Development

### Run Edge Functions Locally

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run functions locally
supabase functions serve

# Test a function
curl -X POST http://localhost:54321/functions/v1/generate-weekly-report \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user-uuid-here"}'
```

## Deployment

Edge functions are automatically deployed when you push changes. No manual deployment needed.

## Testing

### Test Email Sending (without RESEND_API_KEY)

The functions will log `[DRY-RUN]` messages if `RESEND_API_KEY` is not set, allowing you to test the logic without actually sending emails.

### Manual Report Generation

```bash
# Generate a weekly report for a user
curl -X POST https://your-project.supabase.co/functions/v1/generate-weekly-report \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "actual-user-uuid"}'
```

## Monitoring

### Check Cron Job Status

```sql
SELECT * FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### View Edge Function Logs

Go to Edge Functions > Your Function > Logs in Supabase dashboard.

## Smoke Test Checklist

- [ ] New user can sign up and see dashboard with zeros (no placeholders)
- [ ] Admin menu hidden for non-admin users
- [ ] Admin menu visible only for pranav.n@ideaye.in
- [ ] Practice attempts update dashboard stats in real-time
- [ ] Settings toggles persist in cognitive_profile
- [ ] Profile page shows exam enrollments
- [ ] "Set Active" exam works and updates dashboard
- [ ] Calibration timeline shows JQS scores after justifications
- [ ] "Download Report" generates PDF and opens signed URL
- [ ] Account connections show linked providers (Google/Apple)
- [ ] Link Google/Apple buttons work for phone users
- [ ] Daily email respects user preferences
- [ ] Weekly report generation creates PDF in storage
- [ ] Weekly report email sends to opted-in users

## Troubleshooting

### "Reports bucket not found"
Create the `reports` bucket in Storage with private access.

### "Email not sending"
1. Check if `RESEND_API_KEY` is set
2. Verify domain is validated in Resend dashboard
3. Check edge function logs for errors

### "Admin route not working"
1. Verify `is_admin = true` for pranav.n@ideaye.in in profiles table
2. Check browser console for RLS errors
3. Clear browser cache and re-login

### "Report download fails"
1. Check if reports bucket exists and is private
2. Verify RLS policies on calibration_reports table
3. Check edge function logs for storage errors
