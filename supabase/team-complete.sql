-- Anovic Team Platform complete Supabase setup
-- Run this entire file in the Supabase SQL Editor.
-- It is safe to run more than once.

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  nickname text,
  avatar_url text,
  role text not null default 'employee' check (role in ('owner', 'admin', 'manager', 'employee')),
  status text not null default 'away' check (status in ('online', 'break', 'lunch', 'away')),
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
alter table public.team_members add column if not exists role text not null default 'employee' check (role in ('owner', 'admin', 'manager', 'employee'));
alter table public.team_members add column if not exists status text not null default 'away';
alter table public.team_members add column if not exists job_title text;
alter table public.team_members add column if not exists department text;
alter table public.team_members add column if not exists phone text;
alter table public.team_members add column if not exists is_active boolean not null default true;
alter table public.team_members add column if not exists created_at timestamptz not null default now();
alter table public.team_members add column if not exists updated_at timestamptz not null default now();

alter table public.team_members alter column role set default 'employee';
alter table public.team_members alter column status set default 'away';
alter table public.team_members alter column is_active set default true;
alter table public.team_members alter column created_at set default now();
alter table public.team_members alter column updated_at set default now();

alter table public.team_members drop constraint if exists team_members_status_valid;
alter table public.team_members drop constraint if exists team_members_status_check;

update public.team_members
set role = 'employee'
where role is null
   or role not in ('owner', 'admin', 'manager', 'employee');

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

update public.team_members
set is_active = true
where is_active is null;

update public.team_members
set created_at = now()
where created_at is null;

update public.team_members
set updated_at = now()
where updated_at is null;

alter table public.team_members alter column role set not null;
alter table public.team_members alter column status set not null;
alter table public.team_members alter column is_active set not null;
alter table public.team_members alter column created_at set not null;
alter table public.team_members alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_members_role_valid'
      and conrelid = 'public.team_members'::regclass
  ) then
    alter table public.team_members
    add constraint team_members_role_valid
    check (role in ('owner', 'admin', 'manager', 'employee'));
  end if;

  alter table public.team_members
  add constraint team_members_status_valid
  check (status in ('online', 'break', 'lunch', 'away'));
end;
$$;

create table if not exists public.team_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null default 'in_progress' check (status in ('in_progress', 'done')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  assigned_to uuid references public.team_members(id) on delete set null,
  created_by uuid references public.team_members(id) on delete set null,
  due_date date,
  estimated_minutes integer check (estimated_minutes is null or estimated_minutes >= 0),
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  archived_by uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_tasks add column if not exists started_at timestamptz;
alter table public.team_tasks add column if not exists completed_at timestamptz;
alter table public.team_tasks add column if not exists archived_at timestamptz;
alter table public.team_tasks add column if not exists archived_by uuid references public.team_members(id) on delete set null;
alter table public.team_tasks add column if not exists estimated_minutes integer;
alter table public.team_tasks add column if not exists updated_at timestamptz not null default now();

alter table public.team_tasks alter column status set default 'in_progress';
alter table public.team_tasks alter column priority set default 'normal';
alter table public.team_tasks alter column updated_at set default now();

update public.team_tasks
set status = 'in_progress'
where status is null
   or status not in ('in_progress', 'done');

update public.team_tasks
set priority = 'normal'
where priority is null
   or priority not in ('low', 'normal', 'high', 'urgent');

update public.team_tasks
set updated_at = now()
where updated_at is null;

update public.team_tasks
set started_at = coalesce(started_at, created_at, completed_at)
where status = 'done'
  and started_at is null;

alter table public.team_tasks alter column status set not null;
alter table public.team_tasks alter column priority set not null;
alter table public.team_tasks alter column updated_at set not null;

do $$
begin
  alter table public.team_tasks drop constraint if exists team_tasks_status_valid;
  alter table public.team_tasks drop constraint if exists team_tasks_status_check;
  alter table public.team_tasks
  add constraint team_tasks_status_valid
  check (status in ('in_progress', 'done'));

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_tasks_priority_valid'
      and conrelid = 'public.team_tasks'::regclass
  ) then
    alter table public.team_tasks
    add constraint team_tasks_priority_valid
    check (priority in ('low', 'normal', 'high', 'urgent'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'team_tasks_estimated_minutes_valid'
      and conrelid = 'public.team_tasks'::regclass
  ) then
    alter table public.team_tasks
    add constraint team_tasks_estimated_minutes_valid
    check (estimated_minutes is null or estimated_minutes >= 0);
  end if;
end;
$$;

create table if not exists public.task_time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.team_tasks(id) on delete cascade,
  user_id uuid not null references public.team_members(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  constraint task_time_entries_order check (ended_at is null or ended_at >= started_at),
  constraint task_time_entries_duration_valid check (duration_seconds >= 0)
);

create table if not exists public.status_time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.team_members(id) on delete cascade,
  task_id uuid references public.team_tasks(id) on delete set null,
  status text not null check (status in ('online', 'break', 'lunch', 'away', 'offline')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0,
  created_at timestamptz not null default now(),
  constraint status_time_entries_order check (ended_at is null or ended_at >= started_at),
  constraint status_time_entries_duration_valid check (duration_seconds >= 0)
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

create table if not exists public.team_chat_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_by uuid references public.team_members(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint team_chat_groups_name_not_blank check (length(btrim(name)) > 0)
);

create table if not exists public.team_chat_group_members (
  group_id uuid not null references public.team_chat_groups(id) on delete cascade,
  member_id uuid not null references public.team_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (group_id, member_id)
);

create table if not exists public.team_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.team_members(id) on delete cascade,
  recipient_id uuid references public.team_members(id) on delete cascade,
  group_id uuid references public.team_chat_groups(id) on delete cascade,
  reply_to_message_id uuid references public.team_messages(id) on delete set null,
  body text not null,
  read_at timestamptz,
  edited_at timestamptz,
  edited_by uuid references public.team_members(id) on delete set null,
  pinned_at timestamptz,
  pinned_by uuid references public.team_members(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.team_members(id) on delete set null,
  deleted_label text,
  created_at timestamptz not null default now(),
  constraint team_messages_body_not_blank check (length(btrim(body)) > 0),
  constraint team_messages_not_self_direct check (recipient_id is null or recipient_id <> sender_id),
  constraint team_messages_one_target check (recipient_id is null or group_id is null)
);

alter table public.team_messages add column if not exists recipient_id uuid references public.team_members(id) on delete cascade;
alter table public.team_messages add column if not exists group_id uuid references public.team_chat_groups(id) on delete cascade;
alter table public.team_messages add column if not exists reply_to_message_id uuid references public.team_messages(id) on delete set null;
alter table public.team_messages add column if not exists read_at timestamptz;
alter table public.team_messages add column if not exists edited_at timestamptz;
alter table public.team_messages add column if not exists edited_by uuid references public.team_members(id) on delete set null;
alter table public.team_messages add column if not exists pinned_at timestamptz;
alter table public.team_messages add column if not exists pinned_by uuid references public.team_members(id) on delete set null;
alter table public.team_messages add column if not exists deleted_at timestamptz;
alter table public.team_messages add column if not exists deleted_by uuid references public.team_members(id) on delete set null;
alter table public.team_messages add column if not exists deleted_label text;
alter table public.team_messages add column if not exists created_at timestamptz not null default now();
alter table public.team_messages alter column created_at set default now();

create table if not exists public.team_chat_reads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.team_members(id) on delete cascade,
  recipient_id uuid references public.team_members(id) on delete cascade,
  group_id uuid references public.team_chat_groups(id) on delete cascade,
  last_read_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_chat_reads_one_target check (recipient_id is null or group_id is null),
  constraint team_chat_reads_not_self_direct check (recipient_id is null or recipient_id <> user_id)
);

create table if not exists public.team_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.team_messages(id) on delete cascade,
  file_name text not null,
  file_url text not null,
  file_type text,
  file_size integer,
  created_at timestamptz not null default now()
);

create table if not exists public.team_message_mentions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.team_messages(id) on delete cascade,
  mentioned_user_id uuid not null references public.team_members(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (message_id, mentioned_user_id)
);

create table if not exists public.team_message_reactions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.team_messages(id) on delete cascade,
  user_id uuid not null references public.team_members(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  constraint team_message_reactions_emoji_valid check (emoji in ('👍', '❤️', '😂', '🔥', '✅', '👀')),
  unique (message_id, user_id, emoji)
);

create table if not exists public.team_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.team_members(id) on delete cascade,
  actor_id uuid references public.team_members(id) on delete set null,
  type text not null default 'system',
  title text not null,
  body text,
  href text not null default '/team',
  entity_table text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.team_notifications add column if not exists recipient_id uuid references public.team_members(id) on delete cascade;
alter table public.team_notifications add column if not exists actor_id uuid references public.team_members(id) on delete set null;
alter table public.team_notifications add column if not exists type text;
alter table public.team_notifications add column if not exists title text;
alter table public.team_notifications add column if not exists body text;
alter table public.team_notifications add column if not exists href text;
alter table public.team_notifications add column if not exists entity_table text;
alter table public.team_notifications add column if not exists entity_id uuid;
alter table public.team_notifications add column if not exists read_at timestamptz;
alter table public.team_notifications add column if not exists created_at timestamptz not null default now();

alter table public.team_notifications alter column type set default 'system';
alter table public.team_notifications alter column href set default '/team';
alter table public.team_notifications alter column created_at set default now();

update public.team_notifications
set type = 'system'
where type is null
   or type not in ('task_assigned', 'task_updated', 'message', 'mention', 'system');

update public.team_notifications
set title = 'Notification'
where title is null
   or btrim(title) = '';

update public.team_notifications
set href = '/team'
where href is null
   or href not like '/team%';

alter table public.team_notifications alter column recipient_id set not null;
alter table public.team_notifications alter column type set not null;
alter table public.team_notifications alter column title set not null;
alter table public.team_notifications alter column href set not null;
alter table public.team_notifications alter column created_at set not null;

do $$
begin
  alter table public.team_notifications drop constraint if exists team_notifications_type_valid;
  alter table public.team_notifications drop constraint if exists team_notifications_title_not_blank;
  alter table public.team_notifications drop constraint if exists team_notifications_href_team_path;

  alter table public.team_notifications
  add constraint team_notifications_type_valid
  check (type in ('task_assigned', 'task_updated', 'message', 'mention', 'system'));

  alter table public.team_notifications
  add constraint team_notifications_title_not_blank
  check (length(btrim(title)) > 0);

  alter table public.team_notifications
  add constraint team_notifications_href_team_path
  check (href like '/team%');
end;
$$;

create index if not exists team_tasks_assigned_to_idx on public.team_tasks(assigned_to);
create index if not exists team_tasks_status_idx on public.team_tasks(status);
create index if not exists team_tasks_archived_at_idx on public.team_tasks(archived_at);
create index if not exists task_time_entries_task_id_idx on public.task_time_entries(task_id);
create index if not exists task_time_entries_user_id_idx on public.task_time_entries(user_id);
create index if not exists task_time_entries_open_idx on public.task_time_entries(user_id, task_id) where ended_at is null;
create index if not exists status_time_entries_user_id_idx on public.status_time_entries(user_id);
create index if not exists status_time_entries_task_id_idx on public.status_time_entries(task_id);
create index if not exists status_time_entries_open_idx on public.status_time_entries(user_id) where ended_at is null;
create index if not exists attendance_entries_user_id_idx on public.attendance_entries(user_id);
create index if not exists attendance_entries_clock_in_idx on public.attendance_entries(clock_in desc);
create index if not exists team_chat_groups_created_by_idx on public.team_chat_groups(created_by);
create index if not exists team_chat_group_members_member_id_idx on public.team_chat_group_members(member_id);
create index if not exists team_messages_sender_id_idx on public.team_messages(sender_id);
create index if not exists team_messages_recipient_id_idx on public.team_messages(recipient_id);
create index if not exists team_messages_group_id_idx on public.team_messages(group_id);
create index if not exists team_messages_reply_to_message_id_idx on public.team_messages(reply_to_message_id);
create index if not exists team_messages_created_at_idx on public.team_messages(created_at desc);
create index if not exists team_messages_pinned_at_idx on public.team_messages(pinned_at desc) where pinned_at is not null;
create unique index if not exists team_chat_reads_room_unique on public.team_chat_reads(user_id) where recipient_id is null and group_id is null;
create unique index if not exists team_chat_reads_direct_unique on public.team_chat_reads(user_id, recipient_id) where recipient_id is not null and group_id is null;
create unique index if not exists team_chat_reads_group_unique on public.team_chat_reads(user_id, group_id) where group_id is not null;
create index if not exists team_chat_reads_user_id_idx on public.team_chat_reads(user_id);
create index if not exists team_message_attachments_message_id_idx on public.team_message_attachments(message_id);
create index if not exists team_message_mentions_mentioned_user_id_idx on public.team_message_mentions(mentioned_user_id);
create index if not exists team_message_reactions_message_id_idx on public.team_message_reactions(message_id);
create index if not exists team_message_reactions_user_id_idx on public.team_message_reactions(user_id);
create index if not exists team_notifications_recipient_created_idx on public.team_notifications(recipient_id, created_at desc);
create index if not exists team_notifications_recipient_unread_idx on public.team_notifications(recipient_id, read_at) where read_at is null;
create index if not exists team_notifications_actor_id_idx on public.team_notifications(actor_id);
create index if not exists team_notifications_entity_idx on public.team_notifications(entity_table, entity_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
before update on public.team_members
for each row
execute function public.set_updated_at();

drop trigger if exists set_team_tasks_updated_at on public.team_tasks;
create trigger set_team_tasks_updated_at
before update on public.team_tasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_team_chat_reads_updated_at on public.team_chat_reads;
create trigger set_team_chat_reads_updated_at
before update on public.team_chat_reads
for each row
execute function public.set_updated_at();

create or replace function public.current_team_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select role
      from public.team_members
      where id = auth.uid()
      limit 1
    ),
    'employee'
  );
$$;

create or replace function public.current_team_can_manage()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_members
    where id = auth.uid()
      and role in ('owner', 'admin', 'manager')
      and is_active = true
  );
$$;

create or replace function public.current_team_in_chat_group(p_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.team_chat_group_members member
    where member.group_id = p_group_id
      and member.member_id = auth.uid()
  );
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
  clean_status text;
begin
  clean_status := coalesce(nullif(trim(p_status), ''), 'away');

  if clean_status not in ('online', 'break', 'lunch', 'away') then
    clean_status := 'away';
  end if;

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
    is_active
  )
  select
    auth.uid(),
    users.email,
    nullif(trim(p_full_name), ''),
    nullif(trim(p_nickname), ''),
    nullif(trim(p_job_title), ''),
    clean_status,
    nullif(trim(p_department), ''),
    nullif(trim(p_phone), ''),
    nullif(trim(p_avatar_url), ''),
    true
  from auth.users as users
  where users.id = auth.uid()
  on conflict (id) do update
  set email = coalesce(public.team_members.email, excluded.email),
      full_name = excluded.full_name,
      nickname = excluded.nickname,
      job_title = excluded.job_title,
      status = excluded.status,
      department = excluded.department,
      phone = excluded.phone,
      avatar_url = excluded.avatar_url,
      is_active = true,
      updated_at = now()
  returning * into updated_member;

  return updated_member;
end;
$$;

drop function if exists public.create_team_task(text, text, uuid, text, text, date);
drop function if exists public.create_team_task(text, text, uuid, text, text, text);
drop function if exists public.create_team_task(text, text, uuid, text, text, text, integer);

create or replace function public.create_team_task(
  p_title text,
  p_description text,
  p_assigned_to uuid,
  p_priority text default 'normal',
  p_status text default 'in_progress',
  p_due_date text default null,
  p_estimated_minutes integer default null
)
returns public.team_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  created_task public.team_tasks;
  clean_priority text;
  clean_status text;
begin
  if not public.current_team_can_manage() then
    raise exception 'Only team managers can assign tasks.' using errcode = '42501';
  end if;

  clean_priority := coalesce(nullif(trim(p_priority), ''), 'normal');
  clean_status := coalesce(nullif(trim(p_status), ''), 'in_progress');

  if clean_priority not in ('low', 'normal', 'high', 'urgent') then
    clean_priority := 'normal';
  end if;

  if clean_status not in ('in_progress', 'done') then
    clean_status := 'in_progress';
  end if;

  insert into public.team_tasks (
    title,
    description,
    assigned_to,
    created_by,
    priority,
    status,
    due_date,
    estimated_minutes
  )
  values (
    nullif(trim(p_title), ''),
    nullif(trim(p_description), ''),
    p_assigned_to,
    auth.uid(),
    clean_priority,
    clean_status,
    nullif(trim(coalesce(p_due_date, '')), '')::date,
    case
      when p_estimated_minutes is null then null
      else greatest(p_estimated_minutes, 0)
    end
  )
  returning * into created_task;

  return created_task;
end;
$$;

grant execute on function public.update_own_team_profile(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.create_team_task(text, text, uuid, text, text, text, integer) to authenticated;

create or replace function public.mark_team_chat_read(
  p_recipient_id uuid default null,
  p_group_id uuid default null
)
returns public.team_chat_reads
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_read public.team_chat_reads;
begin
  if p_recipient_id is not null and p_group_id is not null then
    raise exception 'Choose either a direct recipient or a group.' using errcode = '22023';
  end if;

  if p_recipient_id is not null and p_recipient_id = auth.uid() then
    raise exception 'Cannot mark a self direct chat.' using errcode = '22023';
  end if;

  if p_group_id is not null and not (public.current_team_can_manage() or public.current_team_in_chat_group(p_group_id)) then
    raise exception 'You are not in this chat group.' using errcode = '42501';
  end if;

  if p_recipient_id is not null then
    update public.team_chat_reads
    set last_read_at = now()
    where user_id = auth.uid()
      and recipient_id = p_recipient_id
      and group_id is null
    returning * into updated_read;

    if updated_read.id is null then
      insert into public.team_chat_reads (user_id, recipient_id, group_id, last_read_at)
      values (auth.uid(), p_recipient_id, null, now())
      returning * into updated_read;
    end if;
  elsif p_group_id is not null then
    update public.team_chat_reads
    set last_read_at = now()
    where user_id = auth.uid()
      and group_id = p_group_id
      and recipient_id is null
    returning * into updated_read;

    if updated_read.id is null then
      insert into public.team_chat_reads (user_id, recipient_id, group_id, last_read_at)
      values (auth.uid(), null, p_group_id, now())
      returning * into updated_read;
    end if;
  else
    update public.team_chat_reads
    set last_read_at = now()
    where user_id = auth.uid()
      and recipient_id is null
      and group_id is null
    returning * into updated_read;

    if updated_read.id is null then
      insert into public.team_chat_reads (user_id, recipient_id, group_id, last_read_at)
      values (auth.uid(), null, null, now())
      returning * into updated_read;
    end if;
  end if;

  return updated_read;
end;
$$;

create or replace function public.edit_team_message(
  p_message_id uuid,
  p_body text
)
returns public.team_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_message public.team_messages;
begin
  if length(btrim(coalesce(p_body, ''))) = 0 or length(p_body) > 1200 then
    raise exception 'Message body is invalid.' using errcode = '22023';
  end if;

  update public.team_messages
  set body = btrim(p_body),
      edited_at = now(),
      edited_by = auth.uid()
  where id = p_message_id
    and sender_id = auth.uid()
    and deleted_at is null
  returning * into updated_message;

  if updated_message.id is null then
    raise exception 'Message cannot be edited.' using errcode = '42501';
  end if;

  return updated_message;
end;
$$;

create or replace function public.toggle_team_message_pin(
  p_message_id uuid
)
returns public.team_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  target_message public.team_messages;
  updated_message public.team_messages;
begin
  select *
  into target_message
  from public.team_messages
  where id = p_message_id
    and deleted_at is null;

  if target_message.id is null then
    raise exception 'Message cannot be pinned.' using errcode = '42501';
  end if;

  if not (
    public.current_team_can_manage()
    or target_message.sender_id = auth.uid()
    or target_message.recipient_id is null
    or target_message.recipient_id = auth.uid()
    or public.current_team_in_chat_group(target_message.group_id)
  ) then
    raise exception 'Message cannot be pinned.' using errcode = '42501';
  end if;

  update public.team_messages
  set pinned_at = case when pinned_at is null then now() else null end,
      pinned_by = case when pinned_at is null then auth.uid() else null end
  where id = p_message_id
  returning * into updated_message;

  return updated_message;
end;
$$;

grant execute on function public.mark_team_chat_read(uuid, uuid) to authenticated;
grant execute on function public.edit_team_message(uuid, text) to authenticated;
grant execute on function public.toggle_team_message_pin(uuid) to authenticated;

alter table public.team_members enable row level security;
alter table public.team_tasks enable row level security;
alter table public.task_time_entries enable row level security;
alter table public.status_time_entries enable row level security;
alter table public.attendance_entries enable row level security;
alter table public.team_chat_groups enable row level security;
alter table public.team_chat_group_members enable row level security;
alter table public.team_chat_reads enable row level security;
alter table public.team_messages enable row level security;
alter table public.team_message_attachments enable row level security;
alter table public.team_message_mentions enable row level security;
alter table public.team_message_reactions enable row level security;
alter table public.team_notifications enable row level security;

drop policy if exists "Team members can view active teammates" on public.team_members;
drop policy if exists "Team managers can insert members" on public.team_members;
drop policy if exists "Team managers can update members" on public.team_members;
drop policy if exists "team members can read self and managers read all" on public.team_members;
drop policy if exists "managers can create team members" on public.team_members;
drop policy if exists "managers can update team members" on public.team_members;
drop policy if exists "Team tasks are visible to relevant members" on public.team_tasks;
drop policy if exists "Team managers can create tasks" on public.team_tasks;
drop policy if exists "Team managers and assignees can update tasks" on public.team_tasks;
drop policy if exists "Team managers can delete tasks" on public.team_tasks;
drop policy if exists "team can read relevant tasks" on public.team_tasks;
drop policy if exists "managers can create tasks" on public.team_tasks;
drop policy if exists "managers and assignees can update tasks" on public.team_tasks;
drop policy if exists "managers can delete tasks" on public.team_tasks;
drop policy if exists "Team can read relevant task time" on public.task_time_entries;
drop policy if exists "Team can create own task time" on public.task_time_entries;
drop policy if exists "Team can update relevant task time" on public.task_time_entries;
drop policy if exists "Managers can delete task time" on public.task_time_entries;
drop policy if exists "Team can read relevant status time" on public.status_time_entries;
drop policy if exists "Team can create own status time" on public.status_time_entries;
drop policy if exists "Team can update relevant status time" on public.status_time_entries;
drop policy if exists "Managers can delete status time" on public.status_time_entries;
drop policy if exists "Attendance entries are visible to owners and self" on public.attendance_entries;
drop policy if exists "Members can clock themselves in" on public.attendance_entries;
drop policy if exists "Members can update own attendance" on public.attendance_entries;
drop policy if exists "Managers can delete attendance entries" on public.attendance_entries;
drop policy if exists "team can read relevant attendance" on public.attendance_entries;
drop policy if exists "team can clock itself in" on public.attendance_entries;
drop policy if exists "team can update own attendance and managers update all" on public.attendance_entries;
drop policy if exists "managers can delete attendance" on public.attendance_entries;
drop policy if exists "Team can read shared and direct messages" on public.team_messages;
drop policy if exists "Team can send shared and direct messages" on public.team_messages;
drop policy if exists "Team recipients can mark messages read" on public.team_messages;
drop policy if exists "Team managers can moderate messages" on public.team_messages;
drop policy if exists "Team can read own chat groups" on public.team_chat_groups;
drop policy if exists "Team can create chat groups" on public.team_chat_groups;
drop policy if exists "Team can read group members" on public.team_chat_group_members;
drop policy if exists "Team can add group members" on public.team_chat_group_members;
drop policy if exists "Team can read own chat read state" on public.team_chat_reads;
drop policy if exists "Team can create own chat read state" on public.team_chat_reads;
drop policy if exists "Team can update own chat read state" on public.team_chat_reads;
drop policy if exists "Team can read message attachments" on public.team_message_attachments;
drop policy if exists "Team can create message attachments" on public.team_message_attachments;
drop policy if exists "Team can read message mentions" on public.team_message_mentions;
drop policy if exists "Team can create message mentions" on public.team_message_mentions;
drop policy if exists "Team can read message reactions" on public.team_message_reactions;
drop policy if exists "Team can create message reactions" on public.team_message_reactions;
drop policy if exists "Team can delete own message reactions" on public.team_message_reactions;
drop policy if exists "Team can read own notifications" on public.team_notifications;
drop policy if exists "Team can create scoped notifications" on public.team_notifications;
drop policy if exists "Team can update own notifications" on public.team_notifications;
drop policy if exists "Team can delete own notifications" on public.team_notifications;

create policy "Team members can view active teammates"
on public.team_members
for select
to authenticated
using (
  id = auth.uid()
  or is_active = true
  or public.current_team_can_manage()
);

create policy "Team managers can insert members"
on public.team_members
for insert
to authenticated
with check (public.current_team_can_manage());

create policy "Team managers can update members"
on public.team_members
for update
to authenticated
using (public.current_team_can_manage())
with check (public.current_team_can_manage());

create policy "Team tasks are visible to relevant members"
on public.team_tasks
for select
to authenticated
using (
  public.current_team_can_manage()
  or assigned_to = auth.uid()
  or created_by = auth.uid()
);

create policy "Team managers can create tasks"
on public.team_tasks
for insert
to authenticated
with check (public.current_team_can_manage());

create policy "Team managers and assignees can update tasks"
on public.team_tasks
for update
to authenticated
using (
  public.current_team_can_manage()
  or assigned_to = auth.uid()
)
with check (
  public.current_team_can_manage()
  or assigned_to = auth.uid()
);

create policy "Team managers can delete tasks"
on public.team_tasks
for delete
to authenticated
using (
  public.current_team_can_manage()
  or (
    assigned_to = auth.uid()
    and status = 'done'
  )
);

create policy "Team can read relevant task time"
on public.task_time_entries
for select
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Team can create own task time"
on public.task_time_entries
for insert
to authenticated
with check (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Team can update relevant task time"
on public.task_time_entries
for update
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
)
with check (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Managers can delete task time"
on public.task_time_entries
for delete
to authenticated
using (public.current_team_can_manage());

create policy "Team can read relevant status time"
on public.status_time_entries
for select
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Team can create own status time"
on public.status_time_entries
for insert
to authenticated
with check (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Team can update relevant status time"
on public.status_time_entries
for update
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
)
with check (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Managers can delete status time"
on public.status_time_entries
for delete
to authenticated
using (public.current_team_can_manage());

create policy "Attendance entries are visible to owners and self"
on public.attendance_entries
for select
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Members can clock themselves in"
on public.attendance_entries
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Members can update own attendance"
on public.attendance_entries
for update
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
)
with check (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Managers can delete attendance entries"
on public.attendance_entries
for delete
to authenticated
using (public.current_team_can_manage());

create policy "Team can read own chat groups"
on public.team_chat_groups
for select
to authenticated
using (
  public.current_team_can_manage()
  or public.current_team_in_chat_group(id)
);

create policy "Team can create chat groups"
on public.team_chat_groups
for insert
to authenticated
with check (created_by = auth.uid());

create policy "Team can read group members"
on public.team_chat_group_members
for select
to authenticated
using (
  public.current_team_can_manage()
  or member_id = auth.uid()
  or public.current_team_in_chat_group(group_id)
);

create policy "Team can add group members"
on public.team_chat_group_members
for insert
to authenticated
with check (
  public.current_team_can_manage()
  or exists (
    select 1
    from public.team_chat_groups group_owner
    where group_owner.id = public.team_chat_group_members.group_id
      and group_owner.created_by = auth.uid()
  )
);

create policy "Team can read shared and direct messages"
on public.team_messages
for select
to authenticated
using (
  public.current_team_can_manage()
  or
  recipient_id is null
  or sender_id = auth.uid()
  or recipient_id = auth.uid()
  or public.current_team_in_chat_group(group_id)
);

create policy "Team can send shared and direct messages"
on public.team_messages
for insert
to authenticated
with check (
  sender_id = auth.uid()
  and (
    (recipient_id is null and group_id is null)
    or exists (
      select 1
      from public.team_members recipient
      where recipient.id = recipient_id
        and recipient.is_active = true
    )
    or public.current_team_in_chat_group(group_id)
  )
);

create policy "Team recipients can mark messages read"
on public.team_messages
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

create policy "Team managers can moderate messages"
on public.team_messages
for update
to authenticated
using (public.current_team_can_manage())
with check (public.current_team_can_manage());

create policy "Team can read own chat read state"
on public.team_chat_reads
for select
to authenticated
using (
  public.current_team_can_manage()
  or user_id = auth.uid()
);

create policy "Team can create own chat read state"
on public.team_chat_reads
for insert
to authenticated
with check (user_id = auth.uid());

create policy "Team can update own chat read state"
on public.team_chat_reads
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "Team can read message attachments"
on public.team_message_attachments
for select
to authenticated
using (
  exists (
    select 1
    from public.team_messages message
    where message.id = message_id
      and (
        public.current_team_can_manage()
        or message.recipient_id is null
        or message.sender_id = auth.uid()
        or message.recipient_id = auth.uid()
        or public.current_team_in_chat_group(message.group_id)
      )
  )
);

create policy "Team can create message attachments"
on public.team_message_attachments
for insert
to authenticated
with check (
  exists (
    select 1
    from public.team_messages message
    where message.id = message_id
      and message.sender_id = auth.uid()
  )
);

create policy "Team can read message mentions"
on public.team_message_mentions
for select
to authenticated
using (
  public.current_team_can_manage()
  or mentioned_user_id = auth.uid()
  or exists (
    select 1
    from public.team_messages message
    where message.id = message_id
      and (
        message.recipient_id is null
        or message.sender_id = auth.uid()
        or message.recipient_id = auth.uid()
        or public.current_team_in_chat_group(message.group_id)
      )
  )
);

create policy "Team can create message mentions"
on public.team_message_mentions
for insert
to authenticated
with check (
  exists (
    select 1
    from public.team_messages message
    where message.id = message_id
      and message.sender_id = auth.uid()
  )
);

create policy "Team can read message reactions"
on public.team_message_reactions
for select
to authenticated
using (
  exists (
    select 1
    from public.team_messages message
    where message.id = message_id
      and (
        public.current_team_can_manage()
        or message.recipient_id is null
        or message.sender_id = auth.uid()
        or message.recipient_id = auth.uid()
        or public.current_team_in_chat_group(message.group_id)
      )
  )
);

create policy "Team can create message reactions"
on public.team_message_reactions
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.team_messages message
    where message.id = message_id
      and message.deleted_at is null
      and (
        public.current_team_can_manage()
        or message.recipient_id is null
        or message.sender_id = auth.uid()
        or message.recipient_id = auth.uid()
        or public.current_team_in_chat_group(message.group_id)
      )
  )
);

create policy "Team can delete own message reactions"
on public.team_message_reactions
for delete
to authenticated
using (user_id = auth.uid());

create policy "Team can read own notifications"
on public.team_notifications
for select
to authenticated
using (
  recipient_id = auth.uid()
  or public.current_team_can_manage()
);

create policy "Team can create scoped notifications"
on public.team_notifications
for insert
to authenticated
with check (
  actor_id = auth.uid()
  and recipient_id <> auth.uid()
  and href like '/team%'
  and exists (
    select 1
    from public.team_members recipient
    where recipient.id = recipient_id
      and recipient.is_active = true
  )
);

create policy "Team can update own notifications"
on public.team_notifications
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

create policy "Team can delete own notifications"
on public.team_notifications
for delete
to authenticated
using (
  recipient_id = auth.uid()
  or public.current_team_can_manage()
);

insert into public.team_members (
  id,
  email,
  full_name,
  role,
  is_active,
  created_at,
  updated_at
)
select
  users.id,
  users.email,
  coalesce(
    users.raw_user_meta_data ->> 'full_name',
    users.raw_user_meta_data ->> 'name',
    split_part(users.email, '@', 1)
  ),
  case
    when lower(users.email) = 'johnjohn444465@gmail.com' then 'owner'
    else 'employee'
  end,
  true,
  now(),
  now()
from auth.users users
on conflict (id) do update
set email = excluded.email,
    full_name = coalesce(public.team_members.full_name, excluded.full_name),
    role = case
      when lower(excluded.email) = 'johnjohn444465@gmail.com' then 'owner'
      else public.team_members.role
    end,
    is_active = coalesce(public.team_members.is_active, true),
    updated_at = now();

insert into public.team_tasks (
  title,
  description,
  status,
  priority,
  assigned_to,
  created_by,
  due_date
)
select
  'Set up your team profile',
  'Add your name, nickname, position, profile picture, and status so teammates know who you are.',
  'in_progress',
  'normal',
  member.id,
  member.id,
  null
from public.team_members member
where lower(member.email) = 'johnjohn444465@gmail.com'
  and not exists (
    select 1
    from public.team_tasks existing
    where existing.assigned_to = member.id
      and existing.title = 'Set up your team profile'
  );

insert into storage.buckets (id, name, public)
values ('team-avatars', 'team-avatars', true)
on conflict (id) do update
set public = true;

insert into storage.buckets (id, name, public, file_size_limit)
values ('team-chat-files', 'team-chat-files', true, 5242880)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880;

drop policy if exists "Team avatars are publicly readable" on storage.objects;
drop policy if exists "Team members can upload own avatar" on storage.objects;
drop policy if exists "Team members can update own avatar" on storage.objects;
drop policy if exists "Team members can delete own avatar" on storage.objects;
drop policy if exists "public can read team avatars" on storage.objects;
drop policy if exists "team can upload own avatar" on storage.objects;
drop policy if exists "team can update own avatar" on storage.objects;
drop policy if exists "team can delete own avatar" on storage.objects;
drop policy if exists "Team chat files are publicly readable" on storage.objects;
drop policy if exists "Team members can upload chat files" on storage.objects;

create policy "Team avatars are publicly readable"
on storage.objects
for select
using (bucket_id = 'team-avatars');

create policy "Team members can upload own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Team members can update own avatar"
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

create policy "Team members can delete own avatar"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'team-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Team chat files are publicly readable"
on storage.objects
for select
using (bucket_id = 'team-chat-files');

create policy "Team members can upload chat files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'team-chat-files'
  and (storage.foldername(name))[1] = auth.uid()::text
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.team_members;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_tasks;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.attendance_entries;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.task_time_entries;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.status_time_entries;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_chat_reads;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_chat_groups;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_message_mentions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_message_reactions;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.team_notifications;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end;
$$;

-- Production notifications, presence, preferences, security, and audit trail.
alter table public.team_members add column if not exists last_seen_at timestamptz;
alter table public.team_members add column if not exists last_active_at timestamptz;
alter table public.team_members add column if not exists mfa_required boolean not null default false;

alter table public.team_notifications add column if not exists dedupe_key text;
alter table public.team_notifications add column if not exists expires_at timestamptz;
alter table public.team_notifications add column if not exists search_document tsvector
generated always as (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(body, ''))) stored;

update public.team_notifications
set type = 'system'
where type not in (
  'task_assigned', 'task_updated', 'task_due', 'message', 'mention',
  'attendance', 'status', 'admin', 'security', 'system'
);

alter table public.team_notifications drop constraint if exists team_notifications_type_valid;
alter table public.team_notifications
add constraint team_notifications_type_valid
check (type in (
  'task_assigned', 'task_updated', 'task_due', 'message', 'mention',
  'attendance', 'status', 'admin', 'security', 'system'
));

create unique index if not exists team_notifications_dedupe_key_idx
on public.team_notifications(dedupe_key)
where dedupe_key is not null;

create index if not exists team_notifications_search_idx
on public.team_notifications using gin(search_document);

create table if not exists public.team_notification_preferences (
  user_id uuid primary key references public.team_members(id) on delete cascade,
  browser_notifications boolean not null default false,
  toast_enabled boolean not null default true,
  sound_enabled boolean not null default true,
  task_alerts boolean not null default true,
  chat_alerts boolean not null default true,
  attendance_alerts boolean not null default true,
  admin_alerts boolean not null default true,
  email_digest text not null default 'off' check (email_digest in ('off', 'daily', 'weekly')),
  quiet_hours_start time,
  quiet_hours_end time,
  timezone text not null default 'Africa/Cairo',
  last_digest_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.team_members(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists team_push_subscriptions_user_id_idx
on public.team_push_subscriptions(user_id);

create table if not exists public.team_presence (
  user_id uuid not null references public.team_members(id) on delete cascade,
  client_id text not null,
  current_path text,
  visibility_state text not null default 'visible',
  last_seen_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (user_id, client_id),
  constraint team_presence_client_id_valid check (length(client_id) between 8 and 100),
  constraint team_presence_visibility_valid check (visibility_state in ('visible', 'hidden')),
  constraint team_presence_path_valid check (current_path is null or current_path like '/team%')
);

create index if not exists team_presence_last_seen_idx on public.team_presence(last_seen_at desc);

create table if not exists public.team_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.team_members(id) on delete set null,
  action text not null,
  entity_table text,
  entity_id uuid,
  target_user_id uuid references public.team_members(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint team_audit_logs_action_valid check (length(btrim(action)) between 3 and 100)
);

create index if not exists team_audit_logs_created_idx on public.team_audit_logs(created_at desc);
create index if not exists team_audit_logs_actor_idx on public.team_audit_logs(actor_id, created_at desc);
create index if not exists team_audit_logs_target_idx on public.team_audit_logs(target_user_id, created_at desc);

drop trigger if exists set_team_notification_preferences_updated_at on public.team_notification_preferences;
create trigger set_team_notification_preferences_updated_at
before update on public.team_notification_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_team_push_subscriptions_updated_at on public.team_push_subscriptions;
create trigger set_team_push_subscriptions_updated_at
before update on public.team_push_subscriptions
for each row execute function public.set_updated_at();

create or replace function public.current_team_is_active()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.team_members
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.team_notification_category_enabled(
  p_recipient_id uuid,
  p_category text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select case p_category
        when 'tasks' then task_alerts
        when 'chat' then chat_alerts
        when 'attendance' then attendance_alerts
        when 'admin' then admin_alerts
        when 'security' then admin_alerts
        else true
      end
      from public.team_notification_preferences
      where user_id = p_recipient_id
    ),
    true
  );
$$;

create or replace function public.insert_team_notification(
  p_recipient_id uuid,
  p_actor_id uuid,
  p_type text,
  p_title text,
  p_body text,
  p_href text,
  p_entity_table text,
  p_entity_id uuid,
  p_dedupe_key text,
  p_category text default 'system'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  notification_id uuid;
begin
  if p_recipient_id is null or p_recipient_id = p_actor_id then
    return null;
  end if;

  if not exists (
    select 1 from public.team_members
    where id = p_recipient_id and is_active = true
  ) then
    return null;
  end if;

  if not public.team_notification_category_enabled(p_recipient_id, p_category) then
    return null;
  end if;

  insert into public.team_notifications (
    recipient_id, actor_id, type, title, body, href,
    entity_table, entity_id, dedupe_key
  )
  values (
    p_recipient_id,
    p_actor_id,
    p_type,
    left(coalesce(nullif(btrim(p_title), ''), 'Notification'), 140),
    nullif(left(coalesce(p_body, ''), 320), ''),
    case when p_href like '/team%' then p_href else '/team' end,
    p_entity_table,
    p_entity_id,
    p_dedupe_key
  )
  on conflict (dedupe_key) where dedupe_key is not null
  do update set
    type = excluded.type,
    title = excluded.title,
    body = excluded.body,
    href = excluded.href,
    actor_id = excluded.actor_id,
    read_at = null,
    created_at = now()
  returning id into notification_id;

  return notification_id;
end;
$$;

revoke all on function public.insert_team_notification(uuid, uuid, text, text, text, text, text, uuid, text, text) from public, anon, authenticated;

create or replace function public.notify_team_task_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    perform public.insert_team_notification(
      new.assigned_to, new.created_by, 'task_assigned', 'New task assigned', new.title,
      '/team/tasks', 'team_tasks', new.id,
      'task-assigned:' || new.id::text || ':' || coalesce(new.assigned_to::text, ''), 'tasks'
    );
    return new;
  end if;

  if new.assigned_to is distinct from old.assigned_to and new.assigned_to is not null then
    perform public.insert_team_notification(
      new.assigned_to, auth.uid(), 'task_assigned', 'Task assigned to you', new.title,
      '/team/tasks', 'team_tasks', new.id,
      'task-reassigned:' || new.id::text || ':' || new.assigned_to::text, 'tasks'
    );
  end if;

  if new.status is distinct from old.status and new.status = 'done' then
    perform public.insert_team_notification(
      new.created_by, auth.uid(), 'task_updated', 'Task completed', new.title,
      '/team/tasks?status=done', 'team_tasks', new.id,
      'task-completed:' || new.id::text, 'tasks'
    );
  elsif new.started_at is distinct from old.started_at and new.started_at is not null then
    perform public.insert_team_notification(
      new.created_by, auth.uid(), 'task_updated', 'Task started', new.title,
      '/team/tasks', 'team_tasks', new.id,
      'task-started:' || new.id::text, 'tasks'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_team_task_change on public.team_tasks;
create trigger notify_team_task_change
after insert or update of assigned_to, status, started_at on public.team_tasks
for each row execute function public.notify_team_task_change();

create or replace function public.notify_team_message_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recipient record;
  sender_name text;
  target_title text;
  target_href text;
begin
  select coalesce(nullif(full_name, ''), nullif(nickname, ''), email, 'A teammate')
  into sender_name
  from public.team_members where id = new.sender_id;

  if new.recipient_id is not null then
    perform public.insert_team_notification(
      new.recipient_id, new.sender_id, 'message', 'New direct message',
      sender_name || ': ' || new.body,
      '/team/chat?recipient=' || new.sender_id::text,
      'team_messages', new.id,
      'message:' || new.id::text || ':' || new.recipient_id::text, 'chat'
    );
  elsif new.group_id is not null then
    select 'New message in #' || coalesce(name, 'group')
    into target_title from public.team_chat_groups where id = new.group_id;
    target_href := '/team/chat?group=' || new.group_id::text;

    for recipient in
      select member_id from public.team_chat_group_members
      where group_id = new.group_id and member_id <> new.sender_id
    loop
      perform public.insert_team_notification(
        recipient.member_id, new.sender_id, 'message', target_title,
        sender_name || ': ' || new.body, target_href,
        'team_messages', new.id,
        'message:' || new.id::text || ':' || recipient.member_id::text, 'chat'
      );
    end loop;
  else
    for recipient in
      select id from public.team_members where is_active = true and id <> new.sender_id
    loop
      perform public.insert_team_notification(
        recipient.id, new.sender_id, 'message', 'New team room message',
        sender_name || ': ' || new.body, '/team/chat',
        'team_messages', new.id,
        'message:' || new.id::text || ':' || recipient.id::text, 'chat'
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists notify_team_message_created on public.team_messages;
create trigger notify_team_message_created
after insert on public.team_messages
for each row execute function public.notify_team_message_created();

create or replace function public.notify_team_message_mention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_message public.team_messages;
  sender_name text;
  target_href text;
begin
  select * into target_message from public.team_messages where id = new.message_id;
  select coalesce(nullif(full_name, ''), nullif(nickname, ''), email, 'A teammate')
  into sender_name from public.team_members where id = target_message.sender_id;

  target_href := case
    when target_message.group_id is not null then '/team/chat?group=' || target_message.group_id::text
    when target_message.recipient_id is not null then '/team/chat?recipient=' || target_message.sender_id::text
    else '/team/chat'
  end;

  perform public.insert_team_notification(
    new.mentioned_user_id, target_message.sender_id, 'mention', sender_name || ' mentioned you',
    target_message.body, target_href,
    'team_messages', target_message.id,
    'message:' || target_message.id::text || ':' || new.mentioned_user_id::text, 'chat'
  );
  return new;
end;
$$;

drop trigger if exists notify_team_message_mention on public.team_message_mentions;
create trigger notify_team_message_mention
after insert on public.team_message_mentions
for each row execute function public.notify_team_message_mention();

create or replace function public.notify_team_attendance_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  manager record;
  member_name text;
  actor uuid := auth.uid();
  event_title text;
begin
  select coalesce(nullif(full_name, ''), nullif(nickname, ''), email, 'A teammate')
  into member_name from public.team_members where id = new.user_id;

  if tg_op = 'INSERT' then
    event_title := member_name || ' clocked in';
  elsif old.clock_out is null and new.clock_out is not null then
    event_title := member_name || ' clocked out';
  else
    return new;
  end if;

  for manager in
    select id from public.team_members
    where is_active = true and role in ('owner', 'admin', 'manager') and id <> coalesce(actor, new.user_id)
  loop
    perform public.insert_team_notification(
      manager.id, coalesce(actor, new.user_id), 'attendance', event_title, null,
      '/team/attendance', 'attendance_entries', new.id,
      'attendance:' || new.id::text || ':' || event_title || ':' || manager.id::text, 'attendance'
    );
  end loop;

  if tg_op = 'UPDATE' and actor is not null and actor <> new.user_id then
    perform public.insert_team_notification(
      new.user_id, actor, 'admin', 'You were clocked out by an administrator', null,
      '/team/attendance', 'attendance_entries', new.id,
      'admin-clockout:' || new.id::text, 'admin'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_team_attendance_change on public.attendance_entries;
create trigger notify_team_attendance_change
after insert or update of clock_out on public.attendance_entries
for each row execute function public.notify_team_attendance_change();

create or replace function public.notify_team_member_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  manager record;
  member_name text;
begin
  member_name := coalesce(nullif(new.full_name, ''), nullif(new.nickname, ''), new.email, 'A teammate');

  if new.status is distinct from old.status then
    for manager in
      select id from public.team_members
      where is_active = true and role in ('owner', 'admin', 'manager') and id <> new.id
    loop
      perform public.insert_team_notification(
        manager.id, new.id, 'status', member_name || ' is now ' || new.status, null,
        '/team/teammates', 'team_members', new.id,
        'status:' || new.id::text || ':' || new.status || ':' || now()::date::text || ':' || manager.id::text,
        'attendance'
      );
    end loop;
  end if;

  if new.is_active is distinct from old.is_active and auth.uid() is not null and auth.uid() <> new.id then
    perform public.insert_team_notification(
      new.id, auth.uid(), 'admin',
      case when new.is_active then 'Your team account was activated' else 'Your team account was deactivated' end,
      null, '/team/profile', 'team_members', new.id,
      'member-active:' || new.id::text || ':' || new.is_active::text || ':' || now()::text, 'admin'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists notify_team_member_change on public.team_members;
create trigger notify_team_member_change
after update of status, is_active, role, mfa_required on public.team_members
for each row execute function public.notify_team_member_change();

create or replace function public.touch_team_presence(
  p_client_id text,
  p_current_path text,
  p_is_active boolean,
  p_visibility_state text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_client_id text := left(btrim(coalesce(p_client_id, '')), 100);
  clean_path text := left(btrim(coalesce(p_current_path, '/team')), 300);
  clean_visibility text := case when p_visibility_state = 'hidden' then 'hidden' else 'visible' end;
begin
  if not public.current_team_is_active() or length(clean_client_id) < 8 then
    raise exception 'Active team membership required.' using errcode = '42501';
  end if;

  if clean_path not like '/team%' then clean_path := '/team'; end if;

  insert into public.team_presence (
    user_id, client_id, current_path, visibility_state, last_seen_at, last_active_at
  ) values (
    auth.uid(), clean_client_id, clean_path, clean_visibility, now(),
    case when p_is_active then now() else coalesce((
      select last_active_at from public.team_presence
      where user_id = auth.uid() and client_id = clean_client_id
    ), now()) end
  )
  on conflict (user_id, client_id) do update set
    current_path = excluded.current_path,
    visibility_state = excluded.visibility_state,
    last_seen_at = now(),
    last_active_at = case when p_is_active then now() else public.team_presence.last_active_at end;

  update public.team_members set
    last_seen_at = now(),
    last_active_at = case when p_is_active then now() else coalesce(last_active_at, now()) end
  where id = auth.uid();
end;
$$;

grant execute on function public.touch_team_presence(text, text, boolean, text) to authenticated;

create or replace function public.log_team_auth_event(p_action text, p_metadata jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_action not in (
    'auth.sign_in', 'auth.password_changed', 'auth.mfa_enrolled',
    'auth.mfa_removed', 'auth.other_sessions_revoked', 'notifications.preferences_updated'
  ) then
    raise exception 'Unsupported audit action.' using errcode = '22023';
  end if;

  insert into public.team_audit_logs (actor_id, action, target_user_id, metadata)
  values (auth.uid(), p_action, auth.uid(), coalesce(p_metadata, '{}'::jsonb));
end;
$$;

grant execute on function public.log_team_auth_event(text, jsonb) to authenticated;

create or replace function public.audit_team_data_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  entity_uuid uuid;
  target_uuid uuid;
begin
  entity_uuid := nullif(row_data ->> 'id', '')::uuid;
  target_uuid := coalesce(
    nullif(row_data ->> 'assigned_to', '')::uuid,
    nullif(row_data ->> 'user_id', '')::uuid,
    nullif(row_data ->> 'recipient_id', '')::uuid,
    nullif(row_data ->> 'member_id', '')::uuid
  );

  insert into public.team_audit_logs (
    actor_id, action, entity_table, entity_id, target_user_id, metadata
  ) values (
    auth.uid(), lower(tg_table_name || '.' || tg_op), tg_table_name, entity_uuid, target_uuid,
    jsonb_strip_nulls(jsonb_build_object(
      'status', row_data ->> 'status',
      'priority', row_data ->> 'priority',
      'group_id', row_data ->> 'group_id',
      'clock_in', row_data ->> 'clock_in',
      'clock_out', row_data ->> 'clock_out'
    ))
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists audit_team_tasks on public.team_tasks;
create trigger audit_team_tasks after insert or update or delete on public.team_tasks
for each row execute function public.audit_team_data_change();
drop trigger if exists audit_attendance_entries on public.attendance_entries;
create trigger audit_attendance_entries after insert or update or delete on public.attendance_entries
for each row execute function public.audit_team_data_change();
drop trigger if exists audit_team_messages on public.team_messages;
create trigger audit_team_messages after insert or update or delete on public.team_messages
for each row execute function public.audit_team_data_change();

create or replace function public.handle_new_team_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (id, email, full_name, role, status, is_active)
  values (
    new.id,
    new.email,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), ''),
    'employee',
    'away',
    true
  )
  on conflict (id) do update set email = excluded.email;

  insert into public.team_notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_anovic_team on auth.users;
create trigger on_auth_user_created_anovic_team
after insert on auth.users
for each row execute function public.handle_new_team_auth_user();

insert into public.team_notification_preferences (user_id)
select id from public.team_members
on conflict (user_id) do nothing;

create or replace function public.run_team_maintenance()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  task_record record;
  archived_count integer := 0;
  reminder_count integer := 0;
  deleted_count integer := 0;
begin
  update public.team_tasks
  set archived_at = now(), archived_by = coalesce(archived_by, created_by)
  where status = 'done'
    and archived_at is null
    and completed_at < now() - interval '24 hours';
  get diagnostics archived_count = row_count;

  for task_record in
    select id, title, assigned_to, created_by, due_date
    from public.team_tasks
    where assigned_to is not null
      and status <> 'done'
      and archived_at is null
      and due_date <= current_date
  loop
    perform public.insert_team_notification(
      task_record.assigned_to, task_record.created_by, 'task_due',
      case when task_record.due_date < current_date then 'Task overdue' else 'Task due today' end,
      task_record.title, '/team/tasks', 'team_tasks', task_record.id,
      'task-due:' || task_record.id::text || ':' || current_date::text, 'tasks'
    );
    reminder_count := reminder_count + 1;
  end loop;

  delete from public.team_notifications
  where (read_at is not null and created_at < now() - interval '90 days')
     or created_at < now() - interval '180 days'
     or (expires_at is not null and expires_at < now());
  get diagnostics deleted_count = row_count;

  delete from public.team_presence where last_seen_at < now() - interval '7 days';

  return jsonb_build_object(
    'archived_tasks', archived_count,
    'task_reminders', reminder_count,
    'deleted_notifications', deleted_count
  );
end;
$$;

revoke all on function public.run_team_maintenance() from public, anon, authenticated;
grant execute on function public.run_team_maintenance() to service_role;

alter table public.team_notification_preferences enable row level security;
alter table public.team_push_subscriptions enable row level security;
alter table public.team_presence enable row level security;
alter table public.team_audit_logs enable row level security;

drop policy if exists "Team can create scoped notifications" on public.team_notifications;

drop policy if exists "Members can read own notification preferences" on public.team_notification_preferences;
create policy "Members can read own notification preferences"
on public.team_notification_preferences for select to authenticated
using (user_id = auth.uid());
drop policy if exists "Members can create own notification preferences" on public.team_notification_preferences;
create policy "Members can create own notification preferences"
on public.team_notification_preferences for insert to authenticated
with check (user_id = auth.uid());
drop policy if exists "Members can update own notification preferences" on public.team_notification_preferences;
create policy "Members can update own notification preferences"
on public.team_notification_preferences for update to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Members manage own push subscriptions" on public.team_push_subscriptions;
create policy "Members manage own push subscriptions"
on public.team_push_subscriptions for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Active team can read presence" on public.team_presence;
create policy "Active team can read presence"
on public.team_presence for select to authenticated
using (public.current_team_is_active() or public.current_team_can_manage());
drop policy if exists "Members manage own presence" on public.team_presence;
create policy "Members manage own presence"
on public.team_presence for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Members read relevant audit logs" on public.team_audit_logs;
create policy "Members read relevant audit logs"
on public.team_audit_logs for select to authenticated
using (
  public.current_team_can_manage()
  or actor_id = auth.uid()
  or target_user_id = auth.uid()
);

grant select, insert, update on public.team_notification_preferences to authenticated;
grant select, insert, update, delete on public.team_push_subscriptions to authenticated;
grant select, insert, update, delete on public.team_presence to authenticated;
grant select on public.team_audit_logs to authenticated;

do $$
begin
  begin
    alter publication supabase_realtime add table public.team_presence;
  exception when duplicate_object then null; when undefined_object then null; end;
  begin
    alter publication supabase_realtime add table public.team_notification_preferences;
  exception when duplicate_object then null; when undefined_object then null; end;
end;
$$;

create or replace function public.admin_set_team_member_status(
  p_member_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.current_team_can_manage() then
    raise exception 'Manager access required.' using errcode = '42501';
  end if;
  if p_status not in ('online', 'break', 'lunch', 'away') then
    raise exception 'Invalid status.' using errcode = '22023';
  end if;

  update public.team_members set status = p_status where id = p_member_id;
end;
$$;

create or replace function public.manage_team_member_access(
  p_member_id uuid,
  p_role text,
  p_is_active boolean,
  p_mfa_required boolean
)
returns public.team_members
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_role text;
  updated_member public.team_members;
begin
  select role into actor_role from public.team_members
  where id = auth.uid() and is_active = true;
  select role into target_role from public.team_members where id = p_member_id;

  if actor_role not in ('owner', 'admin', 'manager') then
    raise exception 'Manager access required.' using errcode = '42501';
  end if;
  if p_role not in ('owner', 'admin', 'manager', 'employee') then
    raise exception 'Invalid role.' using errcode = '22023';
  end if;
  if p_member_id = auth.uid() and not p_is_active then
    raise exception 'You cannot deactivate your own account.' using errcode = '42501';
  end if;
  if actor_role <> 'owner' and (
    target_role in ('owner', 'admin') or p_role in ('owner', 'admin')
  ) then
    raise exception 'Only the owner can manage owner or admin access.' using errcode = '42501';
  end if;

  update public.team_members
  set role = p_role, is_active = p_is_active, mfa_required = p_mfa_required
  where id = p_member_id
  returning * into updated_member;

  if updated_member.id is null then
    raise exception 'Team member not found.' using errcode = 'P0002';
  end if;

  insert into public.team_audit_logs (actor_id, action, entity_table, entity_id, target_user_id, metadata)
  values (
    auth.uid(), 'team_members.access_updated', 'team_members', p_member_id, p_member_id,
    jsonb_build_object('role', p_role, 'is_active', p_is_active, 'mfa_required', p_mfa_required)
  );

  return updated_member;
end;
$$;

grant execute on function public.admin_set_team_member_status(uuid, text) to authenticated;
grant execute on function public.manage_team_member_access(uuid, text, boolean, boolean) to authenticated;

drop policy if exists "Team managers can update members" on public.team_members;

-- Restrictive membership gates are combined with every permissive policy above.
-- This prevents an unrelated authenticated Supabase user from reading team data.
drop policy if exists "Active membership required" on public.team_members;
create policy "Active membership required"
on public.team_members as restrictive for all to authenticated
using (public.current_team_is_active() or id = auth.uid())
with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_tasks;
create policy "Active membership required"
on public.team_tasks as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.task_time_entries;
create policy "Active membership required"
on public.task_time_entries as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.status_time_entries;
create policy "Active membership required"
on public.status_time_entries as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.attendance_entries;
create policy "Active membership required"
on public.attendance_entries as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_chat_groups;
create policy "Active membership required"
on public.team_chat_groups as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_chat_group_members;
create policy "Active membership required"
on public.team_chat_group_members as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_chat_reads;
create policy "Active membership required"
on public.team_chat_reads as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_messages;
create policy "Active membership required"
on public.team_messages as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_message_attachments;
create policy "Active membership required"
on public.team_message_attachments as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_message_mentions;
create policy "Active membership required"
on public.team_message_mentions as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_message_reactions;
create policy "Active membership required"
on public.team_message_reactions as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_notifications;
create policy "Active membership required"
on public.team_notifications as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_notification_preferences;
create policy "Active membership required"
on public.team_notification_preferences as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_push_subscriptions;
create policy "Active membership required"
on public.team_push_subscriptions as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_presence;
create policy "Active membership required"
on public.team_presence as restrictive for all to authenticated
using (public.current_team_is_active()) with check (public.current_team_is_active());

drop policy if exists "Active membership required" on public.team_audit_logs;
create policy "Active membership required"
on public.team_audit_logs as restrictive for select to authenticated
using (public.current_team_is_active());

select pg_notify('pgrst', 'reload schema');

-- CRM base objects are declared here so every CRM extension below is order-safe.
create table if not exists public.crm_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'sales' check (role in ('owner', 'admin', 'sales')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_clients (
  id uuid primary key default gen_random_uuid(), company_name text not null,
  contact_name text, email text, phone text, website text,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'inactive')),
  account_value numeric(14,2) not null default 0 check (account_value >= 0),
  currency text not null default 'EGP', owner_id uuid references public.crm_members(user_id) on delete set null,
  converted_from_lead uuid unique, created_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(), contact_name text not null,
  company_name text, category text, email text, phone text, website text, source text not null default 'other',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0), currency text not null default 'EGP',
  owner_id uuid references public.crm_members(user_id) on delete set null, next_follow_up_at timestamptz,
  summary text, lost_reason text, converted_client_id uuid references public.crm_clients(id) on delete set null,
  converted_at timestamptz, created_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(), lead_id uuid references public.crm_leads(id) on delete cascade,
  client_id uuid references public.crm_clients(id) on delete cascade,
  activity_type text not null default 'note' check (activity_type in ('note', 'call', 'email', 'meeting', 'follow_up', 'status_change', 'system')),
  title text not null, body text, due_at timestamptz, completed_at timestamptz,
  created_by uuid references public.crm_members(user_id) on delete set null, created_at timestamptz not null default now(),
  constraint crm_activity_parent check ((lead_id is not null and client_id is null) or (lead_id is null and client_id is not null))
);

create or replace function public.current_crm_is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crm_members where user_id = auth.uid() and is_active = true);
$$;
create or replace function public.current_crm_is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crm_members where user_id = auth.uid() and is_active = true and role in ('owner', 'admin'));
$$;
create or replace function public.crm_can_access_record(p_owner_id uuid, p_created_by uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_crm_is_active() and (public.current_crm_is_manager() or p_owner_id = auth.uid() or p_created_by = auth.uid());
$$;
create or replace function public.crm_can_access_lead(p_lead_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crm_leads where id = p_lead_id and public.crm_can_access_record(owner_id, created_by));
$$;
create or replace function public.crm_can_access_client(p_client_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.crm_clients where id = p_client_id and public.crm_can_access_record(owner_id, created_by));
$$;

-- CRM v2: notifications, documents, contacts, integrations, audit, and archiving.
alter table public.crm_members add column if not exists mfa_required boolean not null default false;
alter table public.crm_leads add column if not exists archived_at timestamptz;
alter table public.crm_leads add column if not exists archived_by uuid references public.crm_members(user_id) on delete set null;
alter table public.crm_leads add column if not exists external_source text;
alter table public.crm_leads add column if not exists external_key text;
alter table public.crm_leads add column if not exists imported_at timestamptz;
alter table public.crm_leads add column if not exists category text;
alter table public.crm_leads alter column currency set default 'EGP';
alter table public.crm_clients alter column currency set default 'EGP';
alter table public.crm_clients add column if not exists service_summary text;
alter table public.crm_clients add column if not exists contract_start date;
alter table public.crm_clients add column if not exists renewal_date date;
alter table public.crm_clients add column if not exists payment_status text not null default 'not_set' check (payment_status in ('not_set', 'pending', 'paid', 'overdue'));

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.crm_clients(id) on delete cascade,
  full_name text not null,
  job_title text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_attachments (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  client_id uuid references public.crm_clients(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  file_size bigint not null default 0 check (file_size >= 0 and file_size <= 8388608),
  uploaded_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint crm_attachment_parent check (
    (lead_id is not null and client_id is null) or
    (lead_id is null and client_id is not null)
  )
);

create table if not exists public.crm_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.crm_members(user_id) on delete cascade,
  actor_id uuid references public.crm_members(user_id) on delete set null,
  type text not null check (type in ('lead_assigned', 'lead_updated', 'follow_up', 'client', 'system')),
  title text not null,
  body text,
  href text not null default '/crm',
  entity_table text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_settings (
  id smallint primary key default 1 check (id = 1),
  google_sheet_url text,
  google_apps_script_webhook text,
  google_sync_token text,
  google_import_enabled boolean not null default false,
  google_import_gid text not null default '0',
  google_import_last_synced_at timestamptz,
  google_import_last_result text,
  updated_by uuid references public.crm_members(user_id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.crm_settings add column if not exists google_import_enabled boolean not null default false;
alter table public.crm_settings add column if not exists google_import_gid text not null default '0';
alter table public.crm_settings add column if not exists google_import_last_synced_at timestamptz;
alter table public.crm_settings add column if not exists google_import_last_result text;

create table if not exists public.crm_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.crm_members(user_id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.crm_rate_limits (
  user_id uuid not null references public.crm_members(user_id) on delete cascade,
  action text not null,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 1,
  primary key (user_id, action)
);

create index if not exists crm_contacts_client_idx on public.crm_contacts(client_id);
create index if not exists crm_attachments_lead_idx on public.crm_attachments(lead_id);
create index if not exists crm_attachments_client_idx on public.crm_attachments(client_id);
create index if not exists crm_notifications_recipient_idx on public.crm_notifications(recipient_id, read_at, created_at desc);
create index if not exists crm_audit_created_idx on public.crm_audit_logs(created_at desc);
create index if not exists crm_leads_archived_idx on public.crm_leads(archived_at);
create unique index if not exists crm_leads_external_unique on public.crm_leads(external_source, external_key);

drop trigger if exists set_crm_contacts_updated_at on public.crm_contacts;
create trigger set_crm_contacts_updated_at before update on public.crm_contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_settings_updated_at on public.crm_settings;
create trigger set_crm_settings_updated_at before update on public.crm_settings
for each row execute function public.set_updated_at();

create or replace function public.crm_check_rate_limit(p_action text, p_max_requests integer default 10, p_window_seconds integer default 60)
returns boolean language plpgsql security definer set search_path = public as $$
declare current_row public.crm_rate_limits;
begin
  if not public.current_crm_is_active() then return false; end if;
  select * into current_row from public.crm_rate_limits where user_id = auth.uid() and action = p_action for update;
  if current_row.user_id is null then
    insert into public.crm_rate_limits(user_id, action) values (auth.uid(), p_action);
    return true;
  end if;
  if current_row.window_started_at < now() - make_interval(secs => p_window_seconds) then
    update public.crm_rate_limits set window_started_at = now(), request_count = 1 where user_id = auth.uid() and action = p_action;
    return true;
  end if;
  if current_row.request_count >= p_max_requests then return false; end if;
  update public.crm_rate_limits set request_count = request_count + 1 where user_id = auth.uid() and action = p_action;
  return true;
end;
$$;

revoke all on function public.crm_check_rate_limit(text, integer, integer) from public;
grant execute on function public.crm_check_rate_limit(text, integer, integer) to authenticated;

create or replace function public.set_crm_member_mfa(p_user_id uuid, p_required boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.current_crm_is_manager() then raise exception 'Not authorized'; end if;
  update public.crm_members set mfa_required = p_required where user_id = p_user_id;
end;
$$;
revoke all on function public.set_crm_member_mfa(uuid, boolean) from public;
grant execute on function public.set_crm_member_mfa(uuid, boolean) to authenticated;

create or replace function public.audit_crm_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare row_id uuid;
begin
  if tg_op = 'DELETE' then row_id := (to_jsonb(old) ->> 'id')::uuid;
  else row_id := (to_jsonb(new) ->> 'id')::uuid;
  end if;
  insert into public.crm_audit_logs(actor_id, action, entity_table, entity_id, metadata)
  values (auth.uid(), lower(tg_op), tg_table_name, row_id,
    jsonb_build_object('before', case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
                       'after', case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists audit_crm_leads on public.crm_leads;
create trigger audit_crm_leads after insert or update or delete on public.crm_leads for each row execute function public.audit_crm_change();
drop trigger if exists audit_crm_clients on public.crm_clients;
create trigger audit_crm_clients after insert or update or delete on public.crm_clients for each row execute function public.audit_crm_change();
drop trigger if exists audit_crm_activities on public.crm_activities;
create trigger audit_crm_activities after insert or update or delete on public.crm_activities for each row execute function public.audit_crm_change();
drop trigger if exists audit_crm_contacts on public.crm_contacts;
create trigger audit_crm_contacts after insert or update or delete on public.crm_contacts for each row execute function public.audit_crm_change();

create or replace function public.notify_crm_lead_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.owner_id is not null and new.owner_id is distinct from auth.uid() then
    insert into public.crm_notifications(recipient_id, actor_id, type, title, body, href, entity_table, entity_id)
    values(new.owner_id, auth.uid(), 'lead_assigned', 'New lead assigned', new.contact_name, '/crm/leads/' || new.id, 'crm_leads', new.id);
  elsif tg_op = 'UPDATE' then
    if new.owner_id is distinct from old.owner_id and new.owner_id is not null then
      insert into public.crm_notifications(recipient_id, actor_id, type, title, body, href, entity_table, entity_id)
      values(new.owner_id, auth.uid(), 'lead_assigned', 'Lead assigned to you', new.contact_name, '/crm/leads/' || new.id, 'crm_leads', new.id);
    end if;
    if new.status is distinct from old.status and new.owner_id is not null and new.owner_id is distinct from auth.uid() then
      insert into public.crm_notifications(recipient_id, actor_id, type, title, body, href, entity_table, entity_id)
      values(new.owner_id, auth.uid(), 'lead_updated', 'Lead stage changed', new.contact_name || ' moved to ' || new.status, '/crm/leads/' || new.id, 'crm_leads', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_crm_lead_insert on public.crm_leads;
create trigger notify_crm_lead_insert after insert on public.crm_leads
for each row execute function public.notify_crm_lead_change();
drop trigger if exists notify_crm_lead_update on public.crm_leads;
create trigger notify_crm_lead_update after update of owner_id, status on public.crm_leads
for each row execute function public.notify_crm_lead_change();

create or replace function public.notify_crm_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare lead_owner uuid; lead_name text;
begin
  if new.lead_id is not null and new.due_at is not null then
    select owner_id, contact_name into lead_owner, lead_name from public.crm_leads where id = new.lead_id;
    if lead_owner is not null then
      insert into public.crm_notifications(recipient_id, actor_id, type, title, body, href, entity_table, entity_id)
      values(lead_owner, auth.uid(), 'follow_up', 'Follow-up scheduled', new.title || ' for ' || lead_name, '/crm/leads/' || new.lead_id, 'crm_activities', new.id);
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists notify_crm_activity on public.crm_activities;
create trigger notify_crm_activity after insert on public.crm_activities
for each row execute function public.notify_crm_activity();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('crm-files', 'crm-files', false, 8388608, array['application/pdf','image/png','image/jpeg','image/webp','text/plain','text/csv','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update set public = false, file_size_limit = 8388608;

alter table public.crm_contacts enable row level security;
alter table public.crm_attachments enable row level security;
alter table public.crm_notifications enable row level security;
alter table public.crm_settings enable row level security;
alter table public.crm_audit_logs enable row level security;
alter table public.crm_rate_limits enable row level security;

drop policy if exists "CRM users read contacts" on public.crm_contacts;
create policy "CRM users read contacts" on public.crm_contacts for select to authenticated using (public.crm_can_access_client(client_id));
drop policy if exists "CRM users create contacts" on public.crm_contacts;
create policy "CRM users create contacts" on public.crm_contacts for insert to authenticated with check (created_by = auth.uid() and public.crm_can_access_client(client_id));
drop policy if exists "CRM users update contacts" on public.crm_contacts;
create policy "CRM users update contacts" on public.crm_contacts for update to authenticated using (public.crm_can_access_client(client_id)) with check (public.crm_can_access_client(client_id));
drop policy if exists "CRM managers delete contacts" on public.crm_contacts;
create policy "CRM managers delete contacts" on public.crm_contacts for delete to authenticated using (public.current_crm_is_manager());

drop policy if exists "CRM users read attachments" on public.crm_attachments;
create policy "CRM users read attachments" on public.crm_attachments for select to authenticated using ((lead_id is not null and public.crm_can_access_lead(lead_id)) or (client_id is not null and public.crm_can_access_client(client_id)));
drop policy if exists "CRM users create attachments" on public.crm_attachments;
create policy "CRM users create attachments" on public.crm_attachments for insert to authenticated with check (uploaded_by = auth.uid() and ((lead_id is not null and public.crm_can_access_lead(lead_id)) or (client_id is not null and public.crm_can_access_client(client_id))));
drop policy if exists "CRM users delete attachments" on public.crm_attachments;
create policy "CRM users delete attachments" on public.crm_attachments for delete to authenticated using (uploaded_by = auth.uid() or public.current_crm_is_manager());

drop policy if exists "CRM users read notifications" on public.crm_notifications;
create policy "CRM users read notifications" on public.crm_notifications for select to authenticated using (recipient_id = auth.uid());
drop policy if exists "CRM users update notifications" on public.crm_notifications;
create policy "CRM users update notifications" on public.crm_notifications for update to authenticated using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
drop policy if exists "CRM users delete notifications" on public.crm_notifications;
create policy "CRM users delete notifications" on public.crm_notifications for delete to authenticated using (recipient_id = auth.uid());

drop policy if exists "CRM managers read settings" on public.crm_settings;
create policy "CRM managers read settings" on public.crm_settings for select to authenticated using (public.current_crm_is_manager());
drop policy if exists "CRM managers manage settings" on public.crm_settings;
create policy "CRM managers manage settings" on public.crm_settings for all to authenticated using (public.current_crm_is_manager()) with check (public.current_crm_is_manager());
drop policy if exists "CRM managers read audit" on public.crm_audit_logs;
create policy "CRM managers read audit" on public.crm_audit_logs for select to authenticated using (public.current_crm_is_manager());

drop policy if exists "CRM users upload files" on storage.objects;
create policy "CRM users upload files" on storage.objects for insert to authenticated with check (bucket_id = 'crm-files' and public.current_crm_is_active() and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "CRM users read files" on storage.objects;
create policy "CRM users read files" on storage.objects for select to authenticated using (
  bucket_id = 'crm-files' and exists (
    select 1 from public.crm_attachments attachment
    where attachment.storage_path = name and (
      (attachment.lead_id is not null and public.crm_can_access_lead(attachment.lead_id)) or
      (attachment.client_id is not null and public.crm_can_access_client(attachment.client_id))
    )
  )
);
drop policy if exists "CRM users delete own files" on storage.objects;
create policy "CRM users delete own files" on storage.objects for delete to authenticated using (bucket_id = 'crm-files' and ((storage.foldername(name))[1] = auth.uid()::text or public.current_crm_is_manager()));

do $$ begin
  begin alter publication supabase_realtime add table public.crm_notifications; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.crm_contacts; exception when duplicate_object then null; end;
end $$;

select pg_notify('pgrst', 'reload schema');

-- =============================================================================
-- PRIVATE TEAM CRM AND LEAD SYSTEM
-- Separate CRM data and permissions using the same Supabase Auth project.
-- =============================================================================

create table if not exists public.crm_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'sales' check (role in ('owner', 'admin', 'sales')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists crm_members_email_unique
on public.crm_members (lower(email));

create table if not exists public.crm_clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  email text,
  phone text,
  website text,
  status text not null default 'onboarding' check (status in ('onboarding', 'active', 'inactive')),
  account_value numeric(14,2) not null default 0 check (account_value >= 0),
  currency text not null default 'EGP',
  owner_id uuid references public.crm_members(user_id) on delete set null,
  converted_from_lead uuid unique,
  created_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null,
  company_name text,
  category text,
  email text,
  phone text,
  website text,
  source text not null default 'other',
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  estimated_value numeric(14,2) not null default 0 check (estimated_value >= 0),
  currency text not null default 'EGP',
  owner_id uuid references public.crm_members(user_id) on delete set null,
  next_follow_up_at timestamptz,
  summary text,
  lost_reason text,
  converted_client_id uuid references public.crm_clients(id) on delete set null,
  converted_at timestamptz,
  created_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'crm_clients_converted_lead_fk'
      and conrelid = 'public.crm_clients'::regclass
  ) then
    alter table public.crm_clients
    add constraint crm_clients_converted_lead_fk
    foreign key (converted_from_lead) references public.crm_leads(id) on delete set null;
  end if;
end $$;

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.crm_leads(id) on delete cascade,
  client_id uuid references public.crm_clients(id) on delete cascade,
  activity_type text not null default 'note' check (activity_type in ('note', 'call', 'email', 'meeting', 'follow_up', 'status_change', 'system')),
  title text not null,
  body text,
  due_at timestamptz,
  completed_at timestamptz,
  created_by uuid references public.crm_members(user_id) on delete set null,
  created_at timestamptz not null default now(),
  constraint crm_activity_parent check (
    (lead_id is not null and client_id is null) or
    (lead_id is null and client_id is not null)
  )
);

create table if not exists public.crm_pipeline_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.crm_leads(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references public.crm_members(user_id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists crm_leads_status_idx on public.crm_leads(status);
create index if not exists crm_leads_owner_idx on public.crm_leads(owner_id);
create index if not exists crm_leads_follow_up_idx on public.crm_leads(next_follow_up_at);
create index if not exists crm_clients_owner_idx on public.crm_clients(owner_id);
create index if not exists crm_activities_lead_idx on public.crm_activities(lead_id, created_at desc);
create index if not exists crm_activities_client_idx on public.crm_activities(client_id, created_at desc);

drop trigger if exists set_crm_members_updated_at on public.crm_members;
create trigger set_crm_members_updated_at before update on public.crm_members
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_leads_updated_at on public.crm_leads;
create trigger set_crm_leads_updated_at before update on public.crm_leads
for each row execute function public.set_updated_at();

drop trigger if exists set_crm_clients_updated_at on public.crm_clients;
create trigger set_crm_clients_updated_at before update on public.crm_clients
for each row execute function public.set_updated_at();

create or replace function public.current_crm_is_active()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crm_members
    where user_id = auth.uid() and is_active = true
  );
$$;

create or replace function public.current_crm_is_manager()
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crm_members
    where user_id = auth.uid() and is_active = true and role in ('owner', 'admin')
  );
$$;

create or replace function public.crm_can_access_record(p_owner_id uuid, p_created_by uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select public.current_crm_is_active() and (
    public.current_crm_is_manager() or
    p_owner_id = auth.uid() or
    p_created_by = auth.uid()
  );
$$;

create or replace function public.crm_can_access_lead(p_lead_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crm_leads
    where id = p_lead_id
      and public.crm_can_access_record(owner_id, created_by)
  );
$$;

create or replace function public.crm_can_access_client(p_client_id uuid)
returns boolean language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.crm_clients
    where id = p_client_id
      and public.crm_can_access_record(owner_id, created_by)
  );
$$;

create or replace function public.track_crm_lead_status()
returns trigger language plpgsql security definer
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.crm_pipeline_history (lead_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists track_crm_lead_status_change on public.crm_leads;
create trigger track_crm_lead_status_change
after update of status on public.crm_leads
for each row execute function public.track_crm_lead_status();

create or replace function public.convert_crm_lead(p_lead_id uuid)
returns uuid language plpgsql security definer
set search_path = public
as $$
declare
  target_lead public.crm_leads;
  new_client_id uuid;
begin
  select * into target_lead from public.crm_leads
  where id = p_lead_id for update;

  if target_lead.id is null then
    raise exception 'Lead not found';
  end if;
  if not public.crm_can_access_record(target_lead.owner_id, target_lead.created_by) then
    raise exception 'Not authorized';
  end if;
  if target_lead.converted_client_id is not null then
    return target_lead.converted_client_id;
  end if;

  insert into public.crm_clients (
    company_name, contact_name, email, phone, website, status,
    account_value, currency, owner_id, converted_from_lead, created_by
  ) values (
    coalesce(nullif(target_lead.company_name, ''), target_lead.contact_name),
    target_lead.contact_name, target_lead.email, target_lead.phone,
    target_lead.website, 'onboarding', target_lead.estimated_value,
    target_lead.currency, target_lead.owner_id, target_lead.id, auth.uid()
  ) returning id into new_client_id;

  update public.crm_leads set
    status = 'won', converted_client_id = new_client_id, converted_at = now()
  where id = target_lead.id;

  insert into public.crm_activities (
    client_id, activity_type, title, body, created_by
  ) values (
    new_client_id, 'system', 'Converted from lead',
    'The sales lead was converted into an onboarding client.', auth.uid()
  );

  return new_client_id;
end;
$$;

create or replace function public.set_crm_member_access(
  p_email text,
  p_role text default 'sales',
  p_is_active boolean default true
)
returns public.crm_members language plpgsql security definer
set search_path = public, auth
as $$
declare
  target_user auth.users;
  saved_member public.crm_members;
begin
  if not public.current_crm_is_manager() then
    raise exception 'Not authorized';
  end if;
  if p_role not in ('owner', 'admin', 'sales') then
    raise exception 'Invalid CRM role';
  end if;

  select * into target_user from auth.users
  where lower(email) = lower(trim(p_email)) limit 1;
  if target_user.id is null then
    raise exception 'Supabase Auth user not found';
  end if;

  insert into public.crm_members (user_id, email, full_name, role, is_active)
  values (
    target_user.id,
    lower(target_user.email),
    coalesce(target_user.raw_user_meta_data ->> 'full_name', split_part(target_user.email, '@', 1)),
    case when lower(target_user.email) = 'johnjohn444465@gmail.com' then 'owner' else p_role end,
    case when lower(target_user.email) = 'johnjohn444465@gmail.com' then true else p_is_active end
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(public.crm_members.full_name, excluded.full_name),
    role = case when lower(excluded.email) = 'johnjohn444465@gmail.com' then 'owner' else excluded.role end,
    is_active = case when lower(excluded.email) = 'johnjohn444465@gmail.com' then true else excluded.is_active end
  returning * into saved_member;

  return saved_member;
end;
$$;

revoke all on function public.set_crm_member_access(text, text, boolean) from public;
grant execute on function public.set_crm_member_access(text, text, boolean) to authenticated;
revoke all on function public.convert_crm_lead(uuid) from public;
grant execute on function public.convert_crm_lead(uuid) to authenticated;

insert into public.crm_members (user_id, email, full_name, role, is_active)
select
  id,
  lower(email),
  coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
  'owner',
  true
from auth.users
where lower(email) = 'johnjohn444465@gmail.com'
on conflict (user_id) do update set role = 'owner', is_active = true;

alter table public.crm_members enable row level security;
alter table public.crm_leads enable row level security;
alter table public.crm_clients enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_pipeline_history enable row level security;

drop policy if exists "CRM members can read members" on public.crm_members;
create policy "CRM members can read members" on public.crm_members
for select to authenticated using (public.current_crm_is_active());

drop policy if exists "CRM managers manage members" on public.crm_members;

drop policy if exists "CRM users read accessible leads" on public.crm_leads;
create policy "CRM users read accessible leads" on public.crm_leads
for select to authenticated using (public.crm_can_access_record(owner_id, created_by));

drop policy if exists "CRM users create leads" on public.crm_leads;
create policy "CRM users create leads" on public.crm_leads
for insert to authenticated with check (
  public.current_crm_is_active() and created_by = auth.uid() and
  (owner_id is null or owner_id = auth.uid() or public.current_crm_is_manager())
);

drop policy if exists "CRM users update accessible leads" on public.crm_leads;
create policy "CRM users update accessible leads" on public.crm_leads
for update to authenticated using (public.crm_can_access_record(owner_id, created_by))
with check (public.crm_can_access_record(owner_id, created_by));

drop policy if exists "CRM managers delete leads" on public.crm_leads;
create policy "CRM managers delete leads" on public.crm_leads
for delete to authenticated using (public.current_crm_is_manager());

drop policy if exists "CRM users read accessible clients" on public.crm_clients;
create policy "CRM users read accessible clients" on public.crm_clients
for select to authenticated using (public.crm_can_access_record(owner_id, created_by));

drop policy if exists "CRM users create clients" on public.crm_clients;
create policy "CRM users create clients" on public.crm_clients
for insert to authenticated with check (
  public.current_crm_is_active() and created_by = auth.uid() and
  (owner_id is null or owner_id = auth.uid() or public.current_crm_is_manager())
);

drop policy if exists "CRM users update accessible clients" on public.crm_clients;
create policy "CRM users update accessible clients" on public.crm_clients
for update to authenticated using (public.crm_can_access_record(owner_id, created_by))
with check (public.crm_can_access_record(owner_id, created_by));

drop policy if exists "CRM managers delete clients" on public.crm_clients;
create policy "CRM managers delete clients" on public.crm_clients
for delete to authenticated using (public.current_crm_is_manager());

drop policy if exists "CRM users read activities" on public.crm_activities;
create policy "CRM users read activities" on public.crm_activities
for select to authenticated using (
  (lead_id is not null and public.crm_can_access_lead(lead_id)) or
  (client_id is not null and public.crm_can_access_client(client_id))
);

drop policy if exists "CRM users create activities" on public.crm_activities;
create policy "CRM users create activities" on public.crm_activities
for insert to authenticated with check (
  created_by = auth.uid() and (
    (lead_id is not null and public.crm_can_access_lead(lead_id)) or
    (client_id is not null and public.crm_can_access_client(client_id))
  )
);

drop policy if exists "CRM users update activities" on public.crm_activities;
create policy "CRM users update activities" on public.crm_activities
for update to authenticated using (
  (created_by = auth.uid() or public.current_crm_is_manager()) and
  ((lead_id is not null and public.crm_can_access_lead(lead_id)) or
   (client_id is not null and public.crm_can_access_client(client_id)))
)
with check (
  (created_by = auth.uid() or public.current_crm_is_manager()) and
  ((lead_id is not null and public.crm_can_access_lead(lead_id)) or
   (client_id is not null and public.crm_can_access_client(client_id)))
);

drop policy if exists "CRM users read pipeline history" on public.crm_pipeline_history;
create policy "CRM users read pipeline history" on public.crm_pipeline_history
for select to authenticated using (public.crm_can_access_lead(lead_id));

do $$
begin
  begin alter publication supabase_realtime add table public.crm_leads; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.crm_clients; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.crm_activities; exception when duplicate_object then null; end;
end $$;

select pg_notify('pgrst', 'reload schema');

-- CRM import upgrade repeated at the end for existing installations.
alter table public.crm_leads add column if not exists external_source text;
alter table public.crm_leads add column if not exists external_key text;
alter table public.crm_leads add column if not exists imported_at timestamptz;
alter table public.crm_leads add column if not exists category text;
create unique index if not exists crm_leads_external_unique on public.crm_leads(external_source, external_key);
alter table public.crm_settings add column if not exists google_import_enabled boolean not null default false;
alter table public.crm_settings add column if not exists google_import_gid text not null default '0';
alter table public.crm_settings add column if not exists google_import_last_synced_at timestamptz;
alter table public.crm_settings add column if not exists google_import_last_result text;
select pg_notify('pgrst', 'reload schema');
