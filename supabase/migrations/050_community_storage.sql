-- Create the storage bucket for community photos (if not exists)
insert into storage.buckets (id, name, public)
values ('community-photos', 'community-photos', true)
on conflict (id) do nothing;

-- Drop existing broken policies if any
drop policy if exists "Authenticated users can read community photos" on storage.objects;
drop policy if exists "Approved partners can upload their own community photos" on storage.objects;
drop policy if exists "Approved partners can delete their own community photos" on storage.objects;

-- 1. Read Policy: All authenticated users (Partners, Admins, Members) can view images
create policy "Authenticated users can read community photos"
on storage.objects for select
to authenticated
using (bucket_id = 'community-photos');

-- 2. Insert Policy: Partners can upload to their own folder OR Admins can upload anywhere
create policy "Partners and admins can upload community photos"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community-photos'
  and (
    -- 폴더명이 자신의 partner_id와 일치하는 경우 허용 (my_partner_id() 헬퍼 활용)
    split_part(name, '/', 1) = my_partner_id()::text
    -- 또는 본사 관리자 (view-as 기능 활용 시 업로드 통과를 위함)
    or is_admin_user()
  )
);

-- 3. Delete Policy: Partners can delete from their own folder OR Admins can delete anywhere
create policy "Partners and admins can delete community photos"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'community-photos'
  and (
    split_part(name, '/', 1) = my_partner_id()::text
    or is_admin_user()
  )
);
