-- Create notifications table for user notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  message text,
  type text check (type in ('info', 'success', 'warning', 'error')) default 'info',
  read boolean default false,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Users can view their own notifications
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Create index for performance
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);