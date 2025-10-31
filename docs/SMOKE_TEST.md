# CDNA v0.4.1 Smoke Test (10 minutes)

1) Confirm active exam for current user (SQL editor):
   - `select * from user_exam_enrollments where user_id = auth.uid() and is_active true;`

2) UI: Submit a justification <180 chars → expect toast blocking.

3) Seed a low JQS (<0.35) on latest justification → UI should block next submit.

4) Raise JQS >= 0.35 → UI allows submit.

5) Resubmit same item → user_justifications remains 1 row (upsert works).

6) Queue: `llm_eval_queue` has ≤1 row per justification (unique index).

7) Dashboard cards show values or '—' (no console errors).

8) Admin > Audit chips: show statuses for
   - aif-validator-every-5min
   - eval-justification-worker
   - compute-anchor-metrics
   - aif-retune-difficulty-daily
