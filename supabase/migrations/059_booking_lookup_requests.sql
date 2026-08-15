-- Throttle for "email me my booking links".
--
-- A guest booking exists only in the confirmation email. Lose it and there is
-- no way back to the ticket or the cancel link, because there is no account to
-- sign into — which is why the lookup is worth building. But an endpoint that
-- sends mail to an address a stranger typed needs a limit, or someone who
-- knows a customer booked can fill their inbox, and our sending reputation
-- pays for it.
--
-- One row per address, rewritten in place. There is nothing worth keeping in
-- the history: the only question ever asked is "how long since the last one",
-- and a growing log of who looked up what would be personal data we have no
-- use for.
--
-- No RLS policies on purpose. The table has RLS enabled and no policy, which
-- denies anon and authenticated outright; only the service client, which
-- bypasses RLS, ever touches it. Nothing in the browser has any business
-- reading when someone last asked for their bookings.

create table if not exists public.booking_lookup_requests (
  email        text primary key,
  requested_at timestamptz not null default now(),
  -- Kept for the case where the limit is being hit repeatedly, which is the
  -- shape of abuse rather than of a forgetful customer.
  request_count int not null default 1
);

alter table public.booking_lookup_requests enable row level security;

comment on table public.booking_lookup_requests is
  'Rate limit for the guest booking-lookup email. Service role only.';
