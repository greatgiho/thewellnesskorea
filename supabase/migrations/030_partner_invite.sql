-- Partner invite tokens: admin issues an emailed link with a single-use token;
-- the partner opens it and sets their own password (replaces the old temp-password
-- provisioning). Only the SHA-256 hash of the token is stored.
--
-- Writes go through SECURITY DEFINER RPCs (service_role has no direct DML grant on
-- partners in the numbered-migration lineage), matching the booking/signup pattern.

alter table public.partners
  add column if not exists invite_token_hash text,
  add column if not exists invite_expires_at timestamptz;

-- Admin: fetch the info needed to decide create-vs-reuse before issuing an invite.
create or replace function public.get_partner_account_info(p_person_id uuid)
returns table(email text, user_id uuid, name_ko text)
language sql
security definer
set search_path = public
as $$
  select email, user_id, name_ko from public.partners where id = p_person_id;
$$;

-- Admin: link the auth user and store the invite token hash + expiry.
-- Returns the partner's email + name for the invite email body.
create or replace function public.set_partner_invite(
  p_person_id uuid,
  p_user_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
) returns table(email text, name_ko text)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partners
     set user_id = coalesce(user_id, p_user_id),
         invite_token_hash = p_token_hash,
         invite_expires_at = p_expires_at
   where id = p_person_id;
  if not found then
    raise exception 'partner_not_found';
  end if;
  return query
    select p.email, p.name_ko from public.partners p where p.id = p_person_id;
end;
$$;

-- Partner: redeem an invite token. Validates + clears it (single-use) and returns
-- the linked auth user id. Raises on invalid/expired/unlinked.
create or replace function public.accept_partner_invite(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_user uuid;
begin
  select id, user_id into v_id, v_user
    from public.partners
   where invite_token_hash = p_token_hash
     and invite_expires_at > now()
   limit 1;
  if v_id is null then
    raise exception 'invalid_or_expired';
  end if;
  if v_user is null then
    raise exception 'not_linked';
  end if;
  update public.partners
     set invite_token_hash = null, invite_expires_at = null
   where id = v_id;
  return v_user;
end;
$$;

revoke all on function public.get_partner_account_info(uuid) from public;
grant execute on function public.get_partner_account_info(uuid) to service_role;
revoke all on function public.set_partner_invite(uuid, uuid, text, timestamptz) from public;
grant execute on function public.set_partner_invite(uuid, uuid, text, timestamptz) to service_role;
revoke all on function public.accept_partner_invite(text) from public;
grant execute on function public.accept_partner_invite(text) to service_role;
