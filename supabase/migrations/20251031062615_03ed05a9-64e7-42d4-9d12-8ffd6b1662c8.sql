-- 1.1 Add admin-only flag on exams
alter table public.exams
  add column if not exists is_admin_only boolean not null default false;

-- 1.2 Create practice_items (for Practice page)
create table if not exists public.practice_items (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  stem text not null,
  choices jsonb,
  correct_answer text,
  tags text[] default '{}',
  difficulty int check (difficulty between 1 and 5) default 3,
  created_at timestamp with time zone default now()
);

alter table public.practice_items enable row level security;

-- 1.3 Create calibration_items (for Calibration page)
create table if not exists public.calibration_items (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.exams(id) on delete cascade,
  prompt text not null,
  created_at timestamp with time zone default now()
);

alter table public.calibration_items enable row level security;

-- 1.4 Extend user_justifications to capture extra fields
alter table public.user_justifications
  add column if not exists assumptions text[] default '{}',
  add column if not exists checks_units text,
  add column if not exists perceived_difficulty int;

-- Update attempts table to reference practice_items
alter table public.attempts
  add column if not exists practice_item_id uuid references public.practice_items(id) on delete set null,
  add column if not exists calibration_item_id uuid references public.calibration_items(id) on delete set null;

-- 1.5 RLS Policies
-- Exams: allow all non-admin users to see exams where is_admin_only=false. Allow admin email to see all.
drop policy if exists exams_select on public.exams;
create policy exams_select on public.exams
for select using (
  not is_admin_only
  or exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.email = 'pranav.n@ideaye.in'
  )
);

-- Practice items: user must be enrolled to the exam; admin can see regardless
drop policy if exists pi_select on public.practice_items;
create policy pi_select on public.practice_items
for select using (
  exists (
    select 1 from public.user_exam_enrollments e
    where e.exam_id = practice_items.exam_id and e.user_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id=auth.uid() and p.email='pranav.n@ideaye.in')
);

-- Calibration items: user must be enrolled to the exam; admin can see regardless
drop policy if exists ci_select on public.calibration_items;
create policy ci_select on public.calibration_items
for select using (
  exists (
    select 1 from public.user_exam_enrollments e
    where e.exam_id = calibration_items.exam_id and e.user_id = auth.uid()
  )
  or exists (select 1 from public.profiles p where p.id=auth.uid() and p.email='pranav.n@ideaye.in')
);

-- 1.6 Seed Marketing exam (admin-only), enroll admin, set active
-- Upsert admin profile flag
update public.profiles set is_admin=true where email='pranav.n@ideaye.in';

-- Upsert Marketing exam
insert into public.exams (id, name, is_admin_only)
values ('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Marketing Fundamentals (Admin Test Course)', true)
on conflict (id) do update
set name=excluded.name, is_admin_only=excluded.is_admin_only;

-- Enroll admin & set active
do $$
declare u uuid;
begin
  select id into u from auth.users where email='pranav.n@ideaye.in';
  if u is not null then
    insert into public.user_exam_enrollments(user_id, exam_id, is_active)
    values (u, '3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31', true)
    on conflict (user_id, exam_id) do update set is_active=true;

    update public.user_exam_enrollments
    set is_active=false
    where user_id=u and exam_id <> '3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31';
  end if;
end $$;

-- 1.7 Seed practice_items (10 items)
insert into public.practice_items (exam_id, stem, choices, correct_answer, tags, difficulty) values
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Which metric best indicates efficiency of paid acquisition over time?', '["CAC","LTV","CTR","Impressions"]','CAC', '{acquisition,metrics}', 2),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','A campaign has CAC ₹800, average order value ₹2,500, gross margin 40%, 20% repeat rate. Rough LTV:CAC ratio target for sustainability?', null, '>=3:1', '{unit-economics,ltv}', 3),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','For an A/B test, minimum detectable effect goes down when you…', '["Lower sample size","Increase variance","Increase sample size","Shorten test"]','Increase sample size','{experimentation}', 2),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Define a crisp positioning statement for a premium Apple reseller in 15–25 words.', null, null,'{positioning,brand}', 3),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','What is the primary goal of a TOFU campaign in a full-funnel plan?', '["Sales","Awareness","Retention","Support"]','Awareness','{funnel}', 1),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Pick the MOST actionable segmentation axis for store-level geo campaigns:', '["Age","Pin code cluster","Zodiac sign","Browser"]','Pin code cluster','{segmentation,geo}', 1),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Name 3 signals to build a churn-risk audience from CRM.', null, null,'{crm,retention}', 4),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','You see high CTR, low CVR on Meta. First diagnostic step?', '["Increase budget","Pause ads","Check landing speed & match","Change product price"]','Check landing speed & match','{diagnostics,performance}', 2),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Define north-star metric for a new store launch campaign (one line).', null, null,'{north-star}', 2),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','In a remarketing window test (7 vs 30 days), what artifact could inflate 30-day performance?', '["Creative wearout","Attribution overlap","Frequency cap","Audience size"]','Attribution overlap','{remarketing,measurement}', 3)
on conflict (id) do nothing;

-- 1.8 Seed calibration_items (6 items)
insert into public.calibration_items (exam_id, prompt) values
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Design a quick GTM for a weekend store event to lift Mac footfalls by 15% in 10 days.'),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','You must cut Meta CAC by 25% without dropping weekly sales. Outline experiments.'),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Create a pin-code clustering approach for Hyderabad to prioritize OOH + local influencers.'),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Draft an email subject + preheader to upsell iPhone Pro users into Mac (cross-sell).'),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Pick top 3 KPIs to evaluate a festive TAAM sale across iPhone/Mac and justify.'),
('3a4a1b9a-9e5f-4f7e-9a03-7e1a1d6a2b31','Propose a weekly CRM plan to win back high-value lapsed customers in 30 days.')
on conflict (id) do nothing;