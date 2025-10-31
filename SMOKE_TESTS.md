# Abhyas AI - Smoke Test Checklist

## Pre-requisites
- [ ] Database migration applied successfully
- [ ] Storage bucket `reports` created (private)
- [ ] Auth providers enabled (Google, Apple, Phone)
- [ ] Edge functions deployed
- [ ] Environment variables set (SUPABASE_URL, SERVICE_ROLE_KEY, APP_URL)

## Test 1: New User Onboarding
**Objective:** Verify new users see proper initial state without placeholders

Steps:
1. Create a new user account (not pranav.n@ideaye.in)
2. Complete onboarding and navigate to dashboard

Expected Results:
- [ ] Dashboard loads without errors
- [ ] Practice stats show "0" (not "—" or placeholders)
- [ ] CDNA metrics show "—" (no data yet)
- [ ] Admin menu item is NOT visible
- [ ] No console errors

## Test 2: Admin Access Control
**Objective:** Verify admin routes are properly gated

Steps:
1. Log in as pranav.n@ideaye.in
2. Check sidebar navigation
3. Navigate to /admin/content

Expected Results:
- [ ] Admin menu item IS visible in sidebar
- [ ] /admin/content page loads successfully
- [ ] Can access admin features

Negative test:
- [ ] Log in as non-admin user
- [ ] Try to access /admin/content directly
- [ ] Should redirect to /dashboard or show "Not authorized"

## Test 3: Practice Flow & Real Data
**Objective:** Verify dashboard updates with real practice data

Steps:
1. Complete 3-5 practice questions
2. Return to dashboard
3. Refresh page

Expected Results:
- [ ] Total attempts count increases
- [ ] Accuracy percentage calculated correctly
- [ ] Average time per question displayed
- [ ] Recent activity shows last attempts with ✓/✗
- [ ] No placeholders or "—" in practice stats

## Test 4: Settings Persistence
**Objective:** Verify user preferences are saved

Steps:
1. Navigate to Settings
2. Toggle "Daily Email Summary" ON
3. Toggle "Weekly PDF Report" ON
4. Reload page

Expected Results:
- [ ] Both toggles remain ON after reload
- [ ] Query profiles.cognitive_profile shows:
  ```json
  {
    "report_prefs": {
      "daily_email": true,
      "weekly_pdf": true
    }
  }
  ```

## Test 5: Profile Management
**Objective:** Verify profile updates and exam management

Steps:
1. Navigate to Profile page
2. Update name field
3. Click "Update Name"
4. If multiple enrollments exist, click "Set Active" on one

Expected Results:
- [ ] Name updates successfully
- [ ] Toast notification appears
- [ ] Exam enrollments list displayed
- [ ] Active exam marked clearly
- [ ] "Set Active" changes active exam
- [ ] Dashboard reflects new active exam

## Test 6: Calibration Timeline
**Objective:** Verify JQS scores display after justifications

Steps:
1. Complete at least 1 calibration justification (min 180 chars)
2. Wait for LLM eval worker to process (check eval_adjudications table)
3. Navigate to Profile page

Expected Results:
- [ ] Calibration timeline shows at least 1 entry
- [ ] JQS score displayed with badge color:
  - Green (≥0.7) = good quality
  - Yellow (0.4-0.69) = medium
  - Red (<0.4) = needs improvement
- [ ] Timestamp shows date and time

## Test 7: Report Generation
**Objective:** Verify PDF report creation and download

Steps:
1. Navigate to Profile page
2. Click "Download Report" button
3. Wait for generation

Expected Results:
- [ ] Button shows "Generating..." state
- [ ] PDF opens in new tab
- [ ] PDF contains:
  - Practice summary (attempts, accuracy)
  - CDNA metrics (ECE, anchor scores)
  - Calibration progress
- [ ] New row in calibration_reports table
- [ ] File exists in Storage > reports bucket

## Test 8: Account Connections
**Objective:** Verify identity linking for phone users

Steps:
1. Sign up with Phone OTP
2. Navigate to Settings
3. Check "Account Connections" section
4. Click "Link Google Account"

Expected Results:
- [ ] Phone provider shown as linked
- [ ] Google and Apple show as "Not linked"
- [ ] "Link Google Account" button triggers OAuth flow
- [ ] After linking, status updates to "✓ Google account linked"
- [ ] Can now sign in with either phone or Google

## Test 9: Daily Email Job
**Objective:** Verify daily email respects preferences

Prerequisites:
- [ ] RESEND_API_KEY set in environment
- [ ] Domain validated in Resend
- [ ] User has daily_email = true in preferences

Steps:
1. Manually trigger function:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/send-daily-summary \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
2. Check email inbox

Expected Results:
- [ ] Email received with subject "Your Daily Progress Summary"
- [ ] Contains today's attempt count, accuracy, avg time
- [ ] Shows latest ECE and anchor std
- [ ] "Open Dashboard" link works
- [ ] Users with daily_email = false do NOT receive email

## Test 10: Weekly Report Automation
**Objective:** Verify weekly PDF generation and email

Prerequisites:
- [ ] RESEND_API_KEY set
- [ ] User has weekly_pdf = true

Steps:
1. Trigger generation:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/generate-weekly-report \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "actual-user-uuid"}'
   ```
2. Trigger email:
   ```bash
   curl -X POST https://your-project.supabase.co/functions/v1/send-weekly-report \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```
3. Check email

Expected Results:
- [ ] PDF generated and stored in reports bucket
- [ ] Row inserted in calibration_reports
- [ ] Email received with "Download PDF Report" button
- [ ] Link expires in 3 days (verify signed URL)
- [ ] PDF contains weekly summary

## Test 11: Error Handling
**Objective:** Verify graceful error handling

Steps:
1. Try to generate report with invalid user_id
2. Try to link already-linked identity
3. Try to access admin route as non-admin

Expected Results:
- [ ] Errors logged to console
- [ ] User-friendly toast notifications shown
- [ ] No app crashes or white screens
- [ ] Network errors don't fail silently

## Test 12: RLS Policy Verification
**Objective:** Ensure data security

Steps:
1. Log in as User A
2. Try to query User B's data via browser console:
   ```js
   await supabase.from('attempts').select('*').eq('user_id', 'user-b-uuid')
   ```

Expected Results:
- [ ] Returns empty array (RLS blocks access)
- [ ] Can only see own attempts
- [ ] Can only update own profile
- [ ] Admin can see all data

## Critical Path Summary

**MUST PASS before production:**
1. ✅ Dashboard shows real data (no placeholders)
2. ✅ Admin access properly gated
3. ✅ Practice stats update in real-time
4. ✅ Settings persist correctly
5. ✅ Report generation works
6. ✅ Email sending respects preferences
7. ✅ RLS policies prevent unauthorized access

**Edge Function Deployment Status:**
- [ ] send-daily-summary deployed
- [ ] generate-weekly-report deployed
- [ ] send-weekly-report deployed

**Database Migration Status:**
- [ ] calibration_reports table created
- [ ] Indexes created for performance
- [ ] RLS policies applied
- [ ] Admin user seeded

---

## Test Results Template

Date: _________  
Tester: _________  
Environment: Production / Staging / Local

| Test # | Pass/Fail | Notes |
|--------|-----------|-------|
| 1      |           |       |
| 2      |           |       |
| 3      |           |       |
| 4      |           |       |
| 5      |           |       |
| 6      |           |       |
| 7      |           |       |
| 8      |           |       |
| 9      |           |       |
| 10     |           |       |
| 11     |           |       |
| 12     |           |       |

**Overall Status:** ☐ Ready for Production ☐ Needs Fixes

**Blockers:**
- 
- 

**Notes:**
- 
- 
