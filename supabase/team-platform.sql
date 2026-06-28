-- Anovic Team Platform database setup
-- Run this in Supabase SQL Editor after creating your first Auth user.

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

create index if not exists team_tasks_assigned_to_idx on public.team_tasks(assigned_to);
create index if not exists team_tasks_status_idx on public.team_tasks(status);
create index if not exists attendance_entries_user_id_idx on public.attendance_entries(user_id);
create index if not exists attendance_entries_clock_in_idx on public.attendance_entries(clock_in desc);

alter table public.team_members add column if not exists avatar_url text;
alter table public.team_members add column if not exists nickname text;
alter table public.team_members add column if not exists status text not null default 'away';
alter table public.team_tasks add column if not exists started_at timestamptz;

alter table public.team_members alter column status set default 'away';
alter table public.team_members drop constraint if exists team_members_status_valid;
alter table public.team_members drop constraint if exists team_members_status_check;

update public.team_members
set status = case
  when status = 'available' then 'online'
  when status = 'busy' then 'break'
  when status = 'focus' then 'online'
  when status in ('online', 'break', 'lunch', 'away') then status
  else 'away'
end
where status is null
   or status not in ('online', 'break', 'lunch', 'away');

alter table public.team_members
add constraint team_members_status_valid
check (status in ('online', 'break', 'lunch', 'away'));

insert into storage.buckets (id, name, public)
values ('team-avatars', 'team-avatars', true)
on conflict (id) do update set public = true;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists team_members_set_updated_at on public.team_members;
create trigger team_members_set_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

drop trigger if exists team_tasks_set_updated_at on public.team_tasks;
create trigger team_tasks_set_updated_at
before update on public.team_tasks
for each row execute function public.set_updated_at();

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

drop function if exists public.update_own_team_profile(text, text, text, text, text);
drop function if exists public.update_own_team_profile(text, text, text, text, text, text, text);

create or replace function public.update_own_team_profile(
  p_full_name text,
  p_nickname text,
  p_job_title text,
  p_status text,
  p_department text,
  p_phone text,
  p_avatar_url text
)
returns public.team_members
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_member public.team_members;
begin
  insert into public.team_members (
    id,
    email,
    full_name,
    nickname,
    job_title,
    status,
    department,
    phone,
    avatar_url,
    role,
    is_active
  )
  select
    auth.uid(),
    users.email,
    p_full_name,
    p_nickname,
    p_job_title,
    case
      when p_status in ('online', 'break', 'lunch', 'away') then p_status
      else 'away'
    end,
    p_department,
    p_phone,
    p_avatar_url,
    'employee',
    true
  from auth.users as users
  where users.id = auth.uid()
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    nickname = excluded.nickname,
    job_title = excluded.job_title,
    status = excluded.status,
    department = excluded.department,
    phone = excluded.phone,
    avatar_url = excluded.avatar_url,
    updated_at = now()
  returning * into updated_member;

  return updated_member;
end;
$$;

grant execute on function public.update_own_team_profile(text, text, text, text, text, text, text) to authenticated;

alter table public.team_members enable row level security;
alter table public.team_tasks enable row level security;
alter table public.attendance_entries enable row level security;

drop policy if exists "team members can read self and managers read all" on public.team_members;
create policy "team members can read self and managers read all"
on public.team_members
for select
to authenticated
using (id = auth.uid() or is_active = true or public.current_team_can_manage());

drop policy if exists "managers can create team members" on public.team_members;
create policy "managers can create team members"
on public.team_members
for insert
to authenticated
with check (public.current_team_can_manage());

drop policy if exists "managers can update team members" on public.team_members;
create policy "managers can update team members"
on public.team_members
for update
to authenticated
using (public.current_team_can_manage())
with check (public.current_team_can_manage());

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

drop policy if exists "managers can delete tasks" on public.team_tasks;
create policy "managers can delete tasks"
on public.team_tasks
for delete
to authenticated
using (public.current_team_can_manage());

drop policy if exists "team can read relevant attendance" on public.attendance_entries;
create policy "team can read relevant attendance"
on public.attendance_entries
for select
to authenticated
using (public.current_team_can_manage() or user_id = auth.uid());

drop policy if exists "team can clock itself in" on public.attendance_entries;
create policy "team can clock itself in"
on public.attendance_entries
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "team can update own attendance and managers update all" on public.attendance_entries;
create policy "team can update own attendance and managers update all"
on public.attendance_entries
for update
to authenticated
using (user_id = auth.uid() or public.current_team_can_manage())
with check (user_id = auth.uid() or public.current_team_can_manage());

drop policy if exists "managers can delete attendance" on public.attendance_entries;
create policy "managers can delete attendance"
on public.attendance_entries
for delete
to authenticated
using (public.current_team_can_manage());

drop policy if exists "public can read team avatars" on storage.objects;
create policy "public can read team avatars"
on storage.objects
for select
to public
using (bucket_id = 'team-avatars');

drop policy if exists "team can upload own avatar" on storage.objects;
create policy "team can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "team can update own avatar" on storage.objects;
create policy "team can update own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "team can delete own avatar" on storage.objects;
create policy "team can delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Bootstrap existing Auth users.
-- The first Auth user becomes owner; others become employees.
-- After running this, edit rows in team_members if you want better names/titles.
insert into public.team_members (id, email, full_name, role)
select
  auth_user.id,
  auth_user.email,
  coalesce(auth_user.raw_user_meta_data ->> 'full_name', auth_user.email),
  case when auth_user.row_number = 1 then 'owner' else 'employee' end
from (
  select
    users.id,
    users.email,
    users.raw_user_meta_data,
    row_number() over (order by users.created_at asc) as row_number
  from auth.users as users
  where users.email is not null
) as auth_user
on conflict (id) do nothing;

-- Optional starter task for testing.
insert into public.team_tasks (title, description, status, priority, created_by, assigned_to, due_date)
select
  'Set up the employee platform',
  'Confirm team profiles, task flow, and attendance workflow.',
  'in_progress',
  'high',
  member.id,
  member.id,
  current_date + 7
from public.team_members member
where member.role = 'owner'
  and not exists (
    select 1
    from public.team_tasks existing
    where existing.title = 'Set up the employee platform'
  )
order by member.created_at asc
limit 1;
