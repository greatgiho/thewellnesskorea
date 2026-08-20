-- drink_orders becomes beverage_orders.
--
-- The counter sells beverages. "Drink" was the word that got typed first and
-- then spread — into a table, six columns' worth of comments, two routes, a
-- dozen components and the PayPal custom_id. Renaming the code and leaving the
-- table is how a schema ends up needing a translation note, so it moves too.
--
-- Free to do now and not later: every one of the three databases holds zero
-- rows. A rename is metadata only, but it takes an ACCESS EXCLUSIVE lock, and
-- doing it against a live counter would be a different conversation.
--
-- The constraints, indexes, trigger and policy are renamed as well. `alter
-- table ... rename` moves none of them, so leaving them would give the new
-- table a set of objects still called after the old one — findable only by
-- someone who already knew.

alter table if exists public.drink_orders rename to beverage_orders;

alter index if exists public.drink_orders_pkey
  rename to beverage_orders_pkey;
alter index if exists public.drink_orders_paypal_capture_id_key
  rename to beverage_orders_paypal_capture_id_key;
alter index if exists public.drink_orders_nickname_idx
  rename to beverage_orders_nickname_idx;
alter index if exists public.drink_orders_created_at_idx
  rename to beverage_orders_created_at_idx;

alter table public.beverage_orders
  rename constraint drink_orders_nickname_check to beverage_orders_nickname_check;
alter table public.beverage_orders
  rename constraint drink_orders_amount_check to beverage_orders_amount_check;
alter table public.beverage_orders
  rename constraint drink_orders_currency_check to beverage_orders_currency_check;
alter table public.beverage_orders
  rename constraint drink_orders_status_check to beverage_orders_status_check;
alter table public.beverage_orders
  rename constraint drink_orders_paid_has_capture to beverage_orders_paid_has_capture;
alter table public.beverage_orders
  rename constraint drink_orders_refunded_was_paid to beverage_orders_refunded_was_paid;
-- The foreign key too. Postgres names these itself, so it is the one that gets
-- forgotten: nothing in the table definition mentions it.
alter table public.beverage_orders
  rename constraint drink_orders_created_by_fkey to beverage_orders_created_by_fkey;

alter trigger drink_orders_updated_at on public.beverage_orders
  rename to beverage_orders_updated_at;

-- Policies cannot be renamed in place on every supported version, and this one
-- is a single line to restate. Same rule as 065: admins only, nothing for anon.
-- The customer's page reads through the service client, holding the order id.
drop policy if exists "admin all on drink orders" on public.beverage_orders;
drop policy if exists "admin all on beverage orders" on public.beverage_orders;
create policy "admin all on beverage orders"
  on public.beverage_orders for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

comment on table public.beverage_orders is
  'One counter sale. Created pending when rung up; paid by the PayPal capture; refundable by nickname.';
comment on column public.beverage_orders.nickname is
  'Called out when the beverage is ready, and how a refund is found. Not unique.';
comment on column public.beverage_orders.amount is
  'Copied from the code menu at the time of sale, so a price change cannot rewrite history.';
