-- A payment that was refunded is not a payment that was cancelled.
--
-- payment_status has had four values since 022: pending, paid, failed,
-- cancelled. None of them says "the money arrived and then we gave it back",
-- so refunding a booking has had nowhere to be recorded — which is why it has
-- only ever been done by hand in PayPal's dashboard, leaving our row reading
-- 'paid' forever.
--
-- 'cancelled' was the near miss and it is the wrong word. It already means a
-- charge that never settled: a hold that expired, a capture that was denied
-- (see releaseDeniedBooking). Folding a refund into it would make the day's
-- takings unanswerable — you could no longer tell money that never came from
-- money that came and left.
--
-- beverage_orders spells its own status in text and has said 'refunded' since
-- 065. This brings the older table to the same word.
--
-- Adding a value to an enum is allowed inside a transaction on PG12+; using it
-- in the same one is not. Nothing here uses it — the application does, later.

alter type public.payment_status add value if not exists 'refunded';

comment on column public.payments.status is
  'pending = awaited, paid = settled, failed / cancelled = never settled, refunded = settled then given back.';
