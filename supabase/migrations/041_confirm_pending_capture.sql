-- A capture held for review could never be confirmed.
--
-- record_pending_capture() sets bookings.expires_at = null when PayPal returns
-- a PENDING capture: the money is taken but under review, so the hold-expiry
-- sweep must leave the seat alone rather than cancel a booking that was paid
-- for. confirm_booking_payment, written earlier, read a null deadline as an
-- expired one and refused.
--
-- So the two halves of the same flow disagreed, and every PENDING capture was
-- unconfirmable -- by the webhook that fires when the review clears, and by
-- anything else that tried. Observed in the wild: a $21 sandbox booking sat in
-- pending_payment for four weeks holding a seat, while PayPal had marked its
-- capture COMPLETED the day after checkout.
--
-- Only the deadline check changes. Null now means "no deadline", which is what
-- the rest of the flow already assumes -- the function itself sets expires_at
-- to null on success.

CREATE OR REPLACE FUNCTION public.confirm_booking_payment(p_merchant_uid text, p_pg_tid text, p_pg_provider text, p_amount numeric)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  -- A null deadline means the hold has none, not that it lapsed.
  -- record_pending_capture clears expires_at on purpose when a capture is
  -- under review: the money is taken, so the seat must not be swept away
  -- while PayPal decides. Reading that as expired refused the very
  -- confirmation the review was waiting to allow.
  if v_booking.expires_at is not null and v_booking.expires_at <= now() then
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
