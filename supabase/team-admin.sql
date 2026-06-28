-- Anovic Team Platform admin/task upgrade
-- Run this in Supabase SQL Editor to enable admin dashboards and task assignment.

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  nickname text,
  avatar_url text,
  role text not null default 'employee'
    check (role in ('owner', 'admin', 'manager', 'employee')),
  status text not null default 'away'
    check (status in ('online', 'break', 'lunch', 'away')),
  job_title text,
  department text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'done')),
  priority text not null default 'normal'
    check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references public.team_members(id) on delete set null,
  created_by uuid references public.team_members(id) on delete set null,
  due_date date,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.attendance_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.team_members(id) on delete cascade,
  clock_in timestamptz not null default now(),
  clock_out timestamptz,
  note text,
  created_at timestamptz not null default now(),
  constraint attendance_clock_order check (clock_out is null or clock_out >= clock_in)
);

alter table public.team_tasks add column if not exists started_at timestamptz;
alter table public.team_tasks add column if not exists completed_at timestamptz;
alter table public.team_tasks add column if not exists updated_at timestamptz not null default now();
alter table public.team_members add column if not exists email text;
alter table public.team_members add column if not exists full_name text;
alter table public.team_members add column if not exists nickname text;
alter table public.team_members add column if not exists avatar_url text;
alter table public.team_members add column if not exists status text not null default 'away';
alter table public.team_members add column if not exists job_title text;
alter table public.team_members add column if not exists department text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists is_active boolean not null default true;
alter table public.team_members add column if not exists updated_at timestamptz not null default now();

insert into public.team_members (id, email, full_name, role, is_active)
select
  users.id,
  users.email,
  coalesce(users.raw_user_meta_data ->> 'full_name', users.email),
  case
    when lower(users.email) = 'johnjohn444465@gmail.com' then 'owner'
    else 'employee'
  end,
  true
from auth.users as users
where users.email is not null
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(public.team_members.full_name, excluded.full_name),
  role = case
    when lower(excluded.email) = 'johnjohn444465@gmail.com' then 'owner'
    else public.team_members.role
  end,
  is_active = coalesce(public.team_members.is_active, true),
  updated_at = now();

create or replace function public.current_team_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.team_members
  where id = auth.uid()
    and is_active = true
  limit 1;
$$;

create or replace function public.current_team_can_manage()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_team_role() in ('owner', 'admin', 'manager'), false);
$$;

drop function if exists public.create_team_task(text, text, uuid, text, text, date);
drop function if exists public.create_team_task(text, text, uuid, text, text, text);

create or replace function public.create_team_task(
  p_title text,
  p_description text,
  p_assigned_to uuid,
  p_priority text default 'normal',
  p_status text default 'in_progress',
  p_due_date text default null
)
returns public.team_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  created_task public.team_tasks;
begin
  if not public.current_team_can_manage() then
    raise exception 'Not allowed to create team tasks' using errcode = '42501';
  end if;

  insert into public.team_tasks (
    title,
    description,
    assigned_to,
    created_by,
    priority,
    status,
    due_date,
    completed_at
  )
  values (
    nullif(trim(p_title), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    p_assigned_to,
    auth.uid(),
    coalesce(p_priority, 'normal'),
    coalesce(p_status, 'in_progress'),
    nullif(p_due_date, '')::date,
    case when p_status = 'done' then now() else null end
  )
  returning * into created_task;

  return created_task;
end;
$$;

grant execute on function public.create_team_task(text, text, uuid, text, text, text) to authenticated;

alter table public.team_members enable row level security;
alter table public.team_tasks enable row level security;
alter table public.attendance_entries enable row level security;

drop policy if exists "team members can read self and managers read all" on public.team_members;
create policy "team members can read self and managers read all"
on public.team_members
for select
to authenticated
using (id = auth.uid() or is_active = true or public.current_team_can_manage());

drop policy if exists "team can read relevant tasks" on public.team_tasks;
create policy "team can read relevant tasks"
on public.team_tasks
for select
to authenticated
using (
  public.current_team_can_manage()
  or assigned_to = auth.uid()
  or created_by = auth.uid()
);

drop policy if exists "managers can create tasks" on public.team_tasks;
create policy "managers can create tasks"
on public.team_tasks
for insert
to authenticated
with check (public.current_team_can_manage());

drop policy if exists "managers and assignees can update tasks" on public.team_tasks;
create policy "managers and assignees can update tasks"
on public.team_tasks
for update
to authenticated
using (public.current_team_can_manage() or assigned_to = auth.uid())
with check (public.current_team_can_manage() or assigned_to = auth.uid());

drop policy if exists "team can read relevant attendance" on public.attendance_entries;
create policy "team can read relevant attendance"
on public.attendance_entries
for select
to authenticated
using (public.current_team_can_manage() or user_id = auth.uid());

select pg_notify('pgrst', 'reload schema');
