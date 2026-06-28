-- Anovic Team Platform profile save setup
-- Run this in Supabase SQL Editor if profile saves fail.

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

select pg_notify('pgrst', 'reload schema');
