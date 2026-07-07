-- Partner self-registration RPC (SECURITY DEFINER), matching the booking/waitlist
-- pattern: privileged writes go through owner-run functions rather than direct
-- service_role table access (service_role has no DML grant on partners).
--
-- Behaviour:
--   * If an admin-precreated partners row matches the email (no linked account),
--     link it to the new auth user and return its existing status.
--   * If the email already has a linked partner row -> raise (already registered).
--   * Otherwise insert a new partners row with status 'submitted' (pending
--     admin approval) and return 'submitted'.

create or replace function public.signup_partner(
  p_user_id uuid,
  p_email text,
  p_name_ko text,
  p_name_en text,
  p_kind text,
  p_role_ko text,
  p_role_en text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.partners%rowtype;
  v_slug text;
begin
  select * into v_existing
  from public.partners
  where lower(email) = lower(p_email)
  limit 1;

  if found then
    if v_existing.user_id is not null then
      raise exception 'already_registered' using errcode = 'unique_violation';
    end if;
    update public.partners set user_id = p_user_id where id = v_existing.id;
    return v_existing.registration_status::text;
  end if;

  v_slug := trim(both '-' from
    regexp_replace(lower(coalesce(nullif(trim(p_name_en), ''), 'partner')),
                   '[^a-z0-9]+', '-', 'g'));
  if v_slug = '' then v_slug := 'partner'; end if;
  v_slug := v_slug || '-' || left(p_user_id::text, 8);

  insert into public.partners (
    slug, kind, name_ko, name_en, role_ko, role_en,
    email, user_id, registration_status
  )
  values (
    v_slug,
    p_kind::public.partner_kind,
    trim(p_name_ko),
    trim(p_name_en),
    coalesce(nullif(trim(p_role_ko), ''), '파트너'),
    coalesce(nullif(trim(p_role_en), ''), 'Partner'),
    lower(p_email),
    p_user_id,
    'submitted'::public.partner_registration_status
  );

  return 'submitted';
end;
$$;

revoke all on function public.signup_partner(uuid, text, text, text, text, text, text) from public;
grant execute on function public.signup_partner(uuid, text, text, text, text, text, text) to service_role;
