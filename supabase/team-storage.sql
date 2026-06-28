-- Anovic Team Platform avatar storage setup
-- Run this in Supabase SQL Editor if profile picture uploads fail.

insert into storage.buckets (id, name, public)
values ('team-avatars', 'team-avatars', true)
on conflict (id) do update set public = true;

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
