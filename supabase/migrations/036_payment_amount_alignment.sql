-- Make payment amounts able to represent a discounted price.
--
-- Migration 032 moved sessions and payments to numeric(12,2) and updated
-- create_booking_hold, but confirm_booking_payment kept `p_amount integer`.
-- The capture path reads the stored numeric amount and passes it straight
-- back to that function, so a fractional amount is truncated on the way in
-- and then fails the equality guard:
--
--   p_amount 20.10 -> integer 20, and `20 is distinct from 20.10` -> true
--   -> raise 'Amount mismatch.'
--
-- Every current price is a whole number, so this has never fired. A percentage
-- discount produces fractions immediately ($30 less 33% = $20.10), which would
-- make those bookings impossible to confirm.
--
-- Also relax `amount > 0`: a 100% discount is a legitimate zero-price payment
-- row. Keeping the row (rather than skipping payment entirely) preserves the
-- audit trail — which coupon was applied, and to which booking.

-- ---------------------------------------------------------------------------
-- 1. Allow a zero amount
-- ---------------------------------------------------------------------------

alter table public.payments
  drop constraint if exists payments_amount_check;

alter table public.payments
  add constraint payments_amount_check check (amount >= 0);

-- ---------------------------------------------------------------------------
-- 2. confirm_booking_payment: p_amount integer -> numeric
--    Argument types are part of the identity, so this is a drop + create.
-- ---------------------------------------------------------------------------

-- Drop both signatures so the migration is re-runnable: the integer one on a
-- first run, the numeric one if this is being applied again.
drop function if exists public.confirm_booking_payment(text, text, text, integer);
drop function if exists public.confirm_booking_payment(text, text, text, numeric);

create function public.confirm_booking_payment(
  p_merchant_uid text,
  p_pg_tid text,
  p_pg_provider text,
  p_amount numeric
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
begin
  if trim(p_merchant_uid) = '' then
    raise exception 'merchant_uid is required.';
  end if;

  select *
  into v_payment
  from public.payments
  where merchant_uid = p_merchant_uid
  for update;

  if not found then
    raise exception 'Payment not found.';
  end if;

  if v_payment.status = 'paid' then
    return v_payment.booking_id;
  end if;

  if v_payment.status <> 'pending' then
    raise exception 'Payment is not pending.';
  end if;

  -- Compare on value, not representation: 20.1 and 20.10 are the same charge,
  -- and `is distinct from` on numeric would otherwise depend on trailing zeros
  -- surviving the round trip through the client.
  if p_amount is null or p_amount <> v_payment.amount then
    raise exception 'Amount mismatch.';
  end if;

  select *
  into v_booking
  from public.bookings
  where id = v_payment.booking_id
  for update;

  if not found then
    raise exception 'Booking not found.';
  end if;

  if v_booking.status = 'confirmed' then
    return v_booking.id;
  end if;

  if v_booking.status <> 'pending_payment' then
    raise exception 'Booking is not awaiting payment.';
  end if;

  if v_booking.expires_at is null or v_booking.expires_at <= now() then
    raise exception 'Booking hold has expired.';
  end if;

  update public.payments
  set
    status = 'paid',
    pg_tid = nullif(trim(p_pg_tid), ''),
    pg_provider = coalesce(nullif(trim(p_pg_provider), ''), pg_provider),
    paid_at = now()
  where id = v_payment.id;

  update public.bookings
  set
    status = 'confirmed',
    expires_at = null
  where id = v_booking.id;

  return v_booking.id;
end;
$function$;

-- Recreating the function drops the old grants with it, so service_role has to
-- be re-granted or the capture path loses execute permission.
revoke all on function public.confirm_booking_payment(text, text, text, numeric) from public;
revoke all on function public.confirm_booking_payment(text, text, text, numeric) from anon;
revoke all on function public.confirm_booking_payment(text, text, text, numeric) from authenticated;

grant execute on function public.confirm_booking_payment(text, text, text, numeric)
  to service_role;
