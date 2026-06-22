-- Fix: RETURNING cancel_token ambiguous with RETURNS TABLE column name (013)

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null
)
returns table (booking_id uuid, cancel_token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.sessions%rowtype;
  v_email text;
  v_booking_id uuid;
  v_cancel_token text;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
  end if;

  select *
  into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  if v_session.booked_count >= v_session.capacity then
    raise exception 'Session is full.';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.session_id = p_session_id
      and b.status = 'confirmed'
      and (
        b.guest_email = v_email
        or (p_user_id is not null and b.user_id = p_user_id)
      )
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  insert into public.bookings (
    session_id,
    user_id,
    guest_name,
    guest_email,
    guest_phone
  )
  values (
    p_session_id,
    p_user_id,
    trim(p_guest_name),
    v_email,
    nullif(trim(p_guest_phone), '')
  )
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  update public.sessions
  set booked_count = booked_count + 1
  where id = p_session_id;

  return query select v_booking_id, v_cancel_token;
end;
$$;
