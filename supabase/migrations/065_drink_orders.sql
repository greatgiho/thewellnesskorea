-- Counter sales, under a name someone will answer to.
--
-- The first version of /drinks was one fixed QR on the counter and no row
-- anywhere: PayPal's dashboard was the ledger. That works right up to the
-- first "I'd like to cancel that" — a PayPal dashboard full of $5.00 captures
-- from anonymous buyers cannot be searched by the only thing the customer and
-- the barista both know, which is the name that was called out.
--
-- So a sale becomes a row, made before the money moves. The nickname is on it,
-- the QR points at it, and a refund is a lookup rather than an archaeology
-- exercise. One row per drink rung up, whether or not it ends up paid.
--
-- Not folded into bookings/payments. A booking holds a seat, expires, emails a
-- ticket and has a session behind it; a drink has none of those, and payments
-- is `booking_id not null` because every row in it is about a reservation.
-- Sharing the table would mean nullable columns that mean "not that kind of
-- sale" on both sides.

create table if not exists public.drink_orders (
  id uuid primary key default gen_random_uuid(),

  -- What gets called out when the drink is ready, and what a refund is found
  -- by. Deliberately not unique and deliberately not identifying: two people
  -- called 지호 on the same day is normal, and the created_at beside it is what
  -- tells them apart.
  nickname text not null check (btrim(nickname) <> ''),

  -- The menu lives in code (lib/drinks/menu.ts), so both the name and the
  -- price are copied here at the moment of sale rather than looked up later.
  -- Editing a price must not rewrite what a customer was charged last week,
  -- and a receipt has to survive an item being taken off the menu entirely.
  item_id text not null,
  item_name text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency text not null check (currency in ('KRW', 'USD')),

  -- pending  : rung up, QR on screen, nobody has paid yet
  -- paid     : PayPal capture came back COMPLETED
  -- refunded : we gave it back
  --
  -- No 'cancelled'. A pending order nobody paid is not an event worth
  -- recording — it is a barista who mistyped a name and rang it up again.
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'refunded')),

  paypal_order_id text,
  -- Unique: the capture is PayPal's identifier for the money moving, so the
  -- same one landing on two orders would mean we booked one payment twice.
  paypal_capture_id text unique,
  paypal_refund_id text,

  paid_at timestamptz,
  refunded_at timestamptz,

  -- Who rang it up. Nullable and set null on delete: staff accounts come and
  -- go, and losing one must not take the day's sales with it.
  created_by uuid references auth.users(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The status column and the timestamps are two ways of saying the same
  -- thing, so the database is told they must agree. Without this a row can
  -- read 'paid' with no capture behind it, which is exactly the row nobody
  -- notices until they try to refund it.
  constraint drink_orders_paid_has_capture check (
    status <> 'paid' or (paypal_capture_id is not null and paid_at is not null)
  ),
  constraint drink_orders_refunded_was_paid check (
    status <> 'refunded'
    or (paypal_capture_id is not null and paid_at is not null and refunded_at is not null)
  )
);

-- Finding someone's order is the whole reason this table exists, and people
-- type their own name back in whatever case they feel like.
create index if not exists drink_orders_nickname_idx
  on public.drink_orders (lower(btrim(nickname)));

-- The counter screen is a reverse-chronological list of today.
create index if not exists drink_orders_created_at_idx
  on public.drink_orders (created_at desc);

drop trigger if exists drink_orders_updated_at on public.drink_orders;
create trigger drink_orders_updated_at
  before update on public.drink_orders
  for each row execute function public.set_updated_at();

alter table public.drink_orders enable row level security;

-- Admins only, and nothing for anon.
--
-- The customer's page is reached by holding the order's uuid, which is the
-- same arrangement the ticket and cancel pages use: nobody buying a drink is
-- signed in, so there is no session for RLS to reason about and the id is the
-- credential. That page reads through the service client, so a public select
-- policy here would buy nothing and would let anyone enumerate every nickname
-- and amount we have ever taken.
drop policy if exists "admin all on drink orders" on public.drink_orders;
create policy "admin all on drink orders"
  on public.drink_orders for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

comment on table public.drink_orders is
  'One counter sale. Created pending when rung up; paid by the PayPal capture; refundable by nickname.';
comment on column public.drink_orders.nickname is
  'Called out when the drink is ready, and how a refund is found. Not unique.';
comment on column public.drink_orders.amount is
  'Copied from the code menu at the time of sale, so a price change cannot rewrite history.';
