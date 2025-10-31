-- Fix AIF security issues from linter

-- Enable RLS on question_difficulty_history
alter table question_difficulty_history enable row level security;

-- Admin-only policy for difficulty history
create policy "admin_read_qdh" on question_difficulty_history
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "admin_write_qdh" on question_difficulty_history
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- Fix function search paths
create or replace function norm_text(t text)
returns text 
language sql 
immutable 
security definer
set search_path = public
as $$
  select regexp_replace(lower(coalesce(t,'')), '\s+', ' ', 'g')
$$;

create or replace function compute_item_hash(stem text, correct text, options text[])
returns text 
language sql 
immutable
security definer
set search_path = public
as $$
  select md5(norm_text(stem) || '|' || norm_text(correct) || '|' || array_to_string(options,'|'));
$$;