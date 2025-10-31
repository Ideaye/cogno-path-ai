-- AIF v1: Auto-Item Factory Database Schema

-- 1.1 Tables

-- Quarantine for AI-generated items before human/LLM approval
create table if not exists ai_items_quarantine (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null,
  section text not null,
  payload_json jsonb not null,
  originality_hash text not null,
  quality_score float default 0,
  issues text[] default '{}',
  required_strategy text,
  difficulty_seed_0_1 float,
  reading_len int,
  status text default 'pending',
  generator_version text default 'aif_v1',
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create unique index if not exists uq_aiq_originality on ai_items_quarantine(originality_hash);

-- Validation queue processed by worker
create table if not exists aif_validation_queue (
  id bigserial primary key,
  aiq_id uuid not null references ai_items_quarantine(id) on delete cascade,
  status text default 'queued',
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Difficulty history for live items
create table if not exists question_difficulty_history (
  id bigserial primary key,
  question_id uuid not null,
  old float not null,
  new float not null,
  reason text not null,
  created_at timestamptz default now()
);

-- 1.2 Alter existing tables

-- question_bank enrichments
alter table question_bank
  add column if not exists source text default 'manual',
  add column if not exists generator_version text,
  add column if not exists originality_hash text,
  add column if not exists quality_score float,
  add column if not exists flags_json jsonb;

create unique index if not exists uq_qb_originality on question_bank(originality_hash);

-- profiles admin flag (if not present)
alter table profiles
  add column if not exists is_admin boolean default false;

-- 1.3 Helpers

-- normalize text to hash
create or replace function norm_text(t text)
returns text language sql immutable as $$
  select regexp_replace(lower(coalesce(t,'')), '\s+', ' ', 'g')
$$;

-- compute originality hash from stem+answer+options
create or replace function compute_item_hash(stem text, correct text, options text[])
returns text language sql immutable as $$
  select md5(norm_text(stem) || '|' || norm_text(correct) || '|' || array_to_string(options,'|'));
$$;

-- 1.4 RLS (admin-only for AIF tables)

alter table ai_items_quarantine enable row level security;
alter table aif_validation_queue enable row level security;

-- Allow only admins
create policy "admin_read_aiq" on ai_items_quarantine
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "admin_write_aiq" on ai_items_quarantine
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

create policy "admin_read_aifq" on aif_validation_queue
for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));
create policy "admin_write_aifq" on aif_validation_queue
for all using (exists (select 1 from profiles p where p.id = auth.uid() and p.is_admin));

-- 1.5 Indexes (performance)

create index if not exists idx_aiq_status on ai_items_quarantine(status);
create index if not exists idx_aiq_exam_section on ai_items_quarantine(exam_id, section);
create index if not exists idx_aifq_status on aif_validation_queue(status);