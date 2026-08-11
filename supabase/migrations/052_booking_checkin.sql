-- QR tickets and check-in at the door.
--
-- A booking gets a second token, separate from cancel_token. They are not
-- interchangeable: the ticket is meant to be shown to someone, held up to a
-- camera, and screenshotted, so whatever it carries has to be safe in a
-- stranger's hands. cancel_token is not — it cancels the reservation without
-- authenticating anyone.
--
-- checkin_token identifies a booking and nothing more. Doing anything with it
-- requires a signed-in admin or the partner teaching that session, which is
-- enforced in check_in_booking below rather than by holding the token.
--
-- Same shape as cancel_token (013): 32 random bytes, hex, unique. The default
-- is volatile, so adding the column gives every existing booking its own token
-- rather than one shared value.
alter table public.bookings
  add column if not exists checkin_token text not null
    default encode(gen_random_bytes(32), 'hex'),
  add column if not exists checked_in_at timestamptz,
  add column if not exists checked_in_by uuid references auth.users(id) on delete set null;

create unique index if not exists bookings_checkin_token_key
  on public.bookings (checkin_token);

-- Who may check a booking in: an admin, or the partner listed as the session's
-- instructor. Written once here so the two callers cannot disagree.
create or replace function public.can_check_in_session(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin_user()
      or exists (
           select 1
             from public.sessions s
            where s.id = p_session_id
              and s.instructor_id is not null
              and s.instructor_id = public.my_partner_id()
         );
$$;

/**
 * Check a booking in from its ticket token.
 *
 * Idempotent: scanning a ticket twice is the normal case at a door, not an
 * error. The second scan reports the time of the first rather than moving it,
 * so `was_already_checked_in` is what the screen should react to.
 */
create or replace function public.check_in_booking(p_token text)
returns table (
  booking_id uuid,
  checked_in_at timestamptz,
  was_already_checked_in boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
    from public.bookings
   where checkin_token = p_token
   for update;

  if not found then
    raise exception 'Ticket not found.';
  end if;

  if not public.can_check_in_session(v_booking.session_id) then
    raise exception 'Not allowed to check in this booking.';
  end if;

  -- A cancelled booking must not be admitted, and an expired hold is not a
  -- booking yet. Only a confirmed one is a ticket.
  if v_booking.status <> 'confirmed' then
    raise exception 'This booking is %, so it cannot be checked in.', v_booking.status;
  end if;

  if v_booking.checked_in_at is not null then
    return query select v_booking.id, v_booking.checked_in_at, true;
    return;
  end if;

  update public.bookings
     set checked_in_at = now(),
         checked_in_by = auth.uid()
   where id = v_booking.id
  returning public.bookings.checked_in_at into v_booking.checked_in_at;

  return query select v_booking.id, v_booking.checked_in_at, false;
end;
$$;

/**
 * Undo a check-in.
 *
 * A door gets mis-scans — the wrong person's phone, one ticket held up twice
 * for two people. Without this the only correction is a hand-written UPDATE,
 * so the mistake stays in the attendance record.
 *
 * Keyed by the same token as the check-in, not by booking id, so the screen
 * that offers it never has to hold an id it was not given.
 */
create or replace function public.undo_check_in_booking(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
begin
  select * into v_booking
    from public.bookings
   where checkin_token = p_token
   for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if not public.can_check_in_session(v_booking.session_id) then
    raise exception 'Not allowed to change this booking.';
  end if;

  update public.bookings
     set checked_in_at = null,
         checked_in_by = null
   where id = v_booking.id;

  return v_booking.id;
end;
$$;

revoke all on function public.check_in_booking(text) from public;
revoke all on function public.undo_check_in_booking(text) from public;
grant execute on function public.check_in_booking(text) to authenticated;
grant execute on function public.undo_check_in_booking(text) to authenticated;
