-- Partners replace their own profile photo.
--
-- Deliberately not an RLS update policy on partners. There is one already —
-- "teacher update own partners" — but it only applies while is_published is
-- false, because it exists for editing an application before approval. A
-- published partner cannot touch their row at all, and widening that policy
-- would hand them their name, role, and publication state along with the
-- photo.
--
-- So the same shape as set_session_pricing in 039: a definer function that
-- writes exactly one column, with ownership read from the caller's own partner
-- row rather than from anything passed in.
--
-- The path is checked against that id too. Storage already refuses a write
-- outside the partner's own folder (044), but this function is what records
-- where the photo lives, and a row pointing at someone else's file would be
-- just as wrong as writing one.
--
-- Returns the path being replaced so the caller can delete the file it left
-- behind — a photo saved as .png over an old .jpg lands on a different path,
-- and the old one would otherwise linger.

create or replace function public.set_partner_photo(p_photo_path text)
returns text
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_partner_id uuid;
  v_previous text;
begin
  select id into v_partner_id
  from public.partners
  where user_id = auth.uid()
    and registration_status in ('admin', 'approved');

  if v_partner_id is null then
    raise exception 'Not a partner.';
  end if;

  if p_photo_path is null or trim(p_photo_path) = '' then
    raise exception 'A photo path is required.';
  end if;

  if split_part(p_photo_path, '/', 1) is distinct from v_partner_id::text then
    raise exception 'That photo path belongs to someone else.';
  end if;

  select photo_path into v_previous
  from public.partners
  where id = v_partner_id
  for update;

  update public.partners
  set photo_path = p_photo_path
  where id = v_partner_id;

  return v_previous;
end;
$$;

comment on function public.set_partner_photo is
  'Lets an approved partner point their row at a new profile photo. Definer rather than an RLS update policy because the existing one only covers unpublished rows, and widening it would expose every other column.';

revoke all on function public.set_partner_photo(text) from public;
revoke all on function public.set_partner_photo(text) from anon;
grant execute on function public.set_partner_photo(text) to authenticated, service_role;
