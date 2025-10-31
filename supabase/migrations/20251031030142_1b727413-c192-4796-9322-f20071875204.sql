-- Drop existing functions if signature changed
drop function if exists public.get_last_jqs_for_user_exam(uuid, text);
drop function if exists public.get_last_jqs_for_user_exam(uuid, uuid);
drop function if exists public.get_recent_cron_runs();

-- 1) RPC: last JQS by user (no exam filter needed since sessions don't have exam_id)
create or replace function public.get_last_jqs_for_user_exam(
  p_user uuid,
  p_exam uuid
) returns table (jqs_0_1 numeric, created_at timestamptz)
language sql
security definer
set search_path = public
as $$
  select ea.jqs_0_1, ea.created_at
  from eval_adjudications ea
  join user_justifications uj on uj.id = ea.justification_id
  join train_ai_items ti on ti.id = uj.train_ai_item_id
  join train_ai_sessions ts on ts.id = ti.session_id
  where ts.user_id = p_user
  order by ea.created_at desc
  limit 1;
$$;

revoke all on function public.get_last_jqs_for_user_exam(uuid, uuid) from public;
grant execute on function public.get_last_jqs_for_user_exam(uuid, uuid) to authenticated, service_role;

-- 2) Uniques / indexes for idempotency & speed
create unique index if not exists ux_user_justifications_item
  on user_justifications(train_ai_item_id);

create unique index if not exists ux_llm_eval_queue_justification
  on llm_eval_queue(justification_id);

create unique index if not exists ux_eval_adjudications_justification
  on eval_adjudications(justification_id);

create index if not exists ix_eval_adjudications_created_at
  on eval_adjudications(created_at desc);

-- 3) RLS policies: users may insert/update justifications only for their items
drop policy if exists upsert_own_justification on user_justifications;
create policy upsert_own_justification on user_justifications
for insert
to authenticated
with check (
  exists (
    select 1 from train_ai_items ti
    join train_ai_sessions ts on ts.id = ti.session_id
    where ti.id = user_justifications.train_ai_item_id
      and ts.user_id = auth.uid()
  )
);

drop policy if exists update_own_justification on user_justifications;
create policy update_own_justification on user_justifications
for update
to authenticated
using (
  exists (
    select 1 from train_ai_items ti
    join train_ai_sessions ts on ts.id = ti.session_id
    where ti.id = user_justifications.train_ai_item_id
      and ts.user_id = auth.uid()
  )
);

-- 4) Admin-only RPC to surface recent cron runs (security definer)
create or replace function public.get_recent_cron_runs()
returns table (jobid int, jobname text, status text, start_time timestamptz, end_time timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Ensure caller is admin
  if not exists (select 1 from profiles p where p.id = auth.uid() and coalesce(p.is_admin, false)) then
    raise exception 'not authorized';
  end if;

  return query
  select j.jobid, j.jobname, j.status, j.start_time, j.end_time
  from cron.job_run_details j
  order by j.start_time desc
  limit 12;
end;
$$;

revoke all on function public.get_recent_cron_runs() from public;
grant execute on function public.get_recent_cron_runs() to authenticated, service_role;