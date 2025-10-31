-- Ensure user_justifications has all required columns
alter table if exists public.user_justifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists exam_id uuid,
  add column if not exists train_ai_item_id uuid,
  add column if not exists answer text,
  add column if not exists justification text,
  add column if not exists confidence_0_1 numeric check (confidence_0_1 between 0 and 1);

-- Ensure user_justifications has proper constraints
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'user_justifications_justification_check') then
    alter table public.user_justifications add constraint user_justifications_justification_check check (length(justification) >= 180);
  end if;
end $$;

-- Enable RLS on user_justifications
alter table public.user_justifications enable row level security;

-- Drop old policies if they exist
drop policy if exists uj_ins on public.user_justifications;
drop policy if exists uj_sel on public.user_justifications;

-- Create new policies
create policy uj_ins on public.user_justifications
  for insert with check (auth.uid() = user_id);
create policy uj_sel on public.user_justifications
  for select using (auth.uid() = user_id);

-- Extend attempts table with metadata columns
alter table public.attempts
  add column if not exists strategy_tags text[] default '{}'::text[],
  add column if not exists assumptions text,
  add column if not exists checks text,
  add column if not exists resources jsonb,
  add column if not exists difficulty smallint,
  add column if not exists confidence_0_1 numeric,
  add column if not exists final_answer text,
  add column if not exists latency_ms integer,
  add column if not exists justification_id uuid references public.user_justifications(id) on delete set null;

-- Add constraints
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'attempts_difficulty_check') then
    alter table public.attempts add constraint attempts_difficulty_check check (difficulty between 1 and 5);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'attempts_confidence_check') then
    alter table public.attempts add constraint attempts_confidence_check check (confidence_0_1 between 0 and 1);
  end if;
end $$;

-- Ensure RLS on attempts
alter table public.attempts enable row level security;

drop policy if exists at_ins on public.attempts;
drop policy if exists at_sel on public.attempts;

create policy at_ins on public.attempts
  for insert with check (auth.uid() = user_id);
create policy at_sel on public.attempts
  for select using (auth.uid() = user_id);

-- Create atomic RPC for calibration attempts
create or replace function public.create_calibration_attempt(
  p_exam_id uuid,
  p_train_ai_item_id uuid,
  p_final_answer text,
  p_justification text,
  p_confidence_0_1 numeric,
  p_strategy_tags text[],
  p_assumptions text,
  p_checks text,
  p_resources jsonb,
  p_difficulty smallint,
  p_latency_ms integer,
  p_is_correct boolean
)
returns table (attempt_id uuid, justification_id uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_jid uuid;
  v_aid uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Insert justification
  insert into public.user_justifications (
    user_id, exam_id, train_ai_item_id, answer, justification, confidence_0_1
  ) values (
    v_user_id, p_exam_id, p_train_ai_item_id, p_final_answer, p_justification, p_confidence_0_1
  ) returning id into v_jid;

  -- Insert attempt with all metadata
  insert into public.attempts (
    id, user_id, exam_id, correct, time_taken_ms,
    strategy_tags, assumptions, checks, resources, difficulty,
    confidence_0_1, final_answer, latency_ms, justification_id
  ) values (
    gen_random_uuid(), v_user_id, p_exam_id, p_is_correct, p_latency_ms,
    coalesce(p_strategy_tags, '{}'), p_assumptions, p_checks, p_resources, p_difficulty,
    p_confidence_0_1, p_final_answer, p_latency_ms, v_jid
  ) returning id into v_aid;

  return query select v_aid, v_jid;
end $$;

-- Grant access
revoke all on function public.create_calibration_attempt from public;
grant execute on function public.create_calibration_attempt to authenticated;