-- ===========================================
-- Personal Task & Media Vault — Supabase SQL
-- ===========================================
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

-- 1. Tasks table
create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz default now(),
  title       text not null,
  description text not null default '',
  status      text not null default 'pending' check (status in ('pending', 'completed')),
  user_id     uuid not null references auth.users(id) on delete cascade,
  image_url   text
);

-- Index for faster per-user queries
create index if not exists idx_tasks_user_id on public.tasks(user_id);

-- 2. Enable Row Level Security
alter table public.tasks enable row level security;

-- 3. RLS Policies — users can only access their own tasks
create policy "Users can view own tasks"
  on public.tasks for select
  using (auth.uid() = user_id);

create policy "Users can insert own tasks"
  on public.tasks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tasks"
  on public.tasks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own tasks"
  on public.tasks for delete
  using (auth.uid() = user_id);

-- 4. Storage bucket for task images
-- (Run these one by one if the bucket doesn't exist yet)
insert into storage.buckets (id, name, public)
values ('task-attachments', 'task-attachments', true)
on conflict (id) do nothing;

-- Storage RLS — anyone can read (public bucket), only owner can upload/delete
create policy "Public read access"
  on storage.objects for select
  using (bucket_id = 'task-attachments');

create policy "Authenticated users can upload"
  on storage.objects for insert
  with check (
    bucket_id = 'task-attachments'
    and auth.role() = 'authenticated'
  );

create policy "Users can delete own uploads"
  on storage.objects for delete
  using (
    bucket_id = 'task-attachments'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
