-- Seat tiers: R석, S석, A석.
--
-- The obvious shape is a matrix — grade down one axis, adult/child across the
-- other — and prices really do form one. But a matrix is the wrong thing to
-- store, for a reason that only shows up once you ask where the inventory
-- lives: there are 100 R seats, not 100 R-adult seats and 100 R-child seats.
-- Capacity belongs to the grade, price belongs to the cell.
--
-- So the grade is a row (session_tiers), carrying its own capacity and its own
-- pair of rates, and an order is a list of lines (booking_items), each line
-- saying how many of which grade. That is the shape ticketing systems settle
-- on, and it swallows what we already have: a class with no tiers is a single
-- implicit line, priced from the session, which is exactly today's behaviour.
--
-- Currency is still the session's. A class cannot be USD in R and KRW in S
-- without splitting one order across two payment paths.

create table if not exists public.session_tiers (
  id                 uuid primary key default gen_random_uuid(),
  session_id         uuid not null references public.sessions(id) on delete cascade,
  -- Short, and what the customer sees on the ticket: 'R', 'S', 'VIP'.
  code               text not null check (btrim(code) <> ''),
  -- Optional longer label, e.g. '무대 앞 3열'.
  name               text,
  capacity           int not null check (capacity > 0),
  booked_count       int not null default 0 check (booked_count >= 0),
  price_amount       numeric(12,2) not null default 0 check (price_amount >= 0),
  -- Same meaning as on sessions: null = this tier has no child rate.
  child_price_amount numeric(12,2) check (child_price_amount is null or child_price_amount >= 0),
  sort_order         int not null default 0,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint session_tiers_code_key unique (session_id, code)
);

create index if not exists session_tiers_session_idx
  on public.session_tiers (session_id, sort_order);

drop trigger if exists session_tiers_updated_at on public.session_tiers;
create trigger session_tiers_updated_at
  before update on public.session_tiers
  for each row execute function public.set_updated_at();

alter table public.session_tiers enable row level security;

-- Read by anyone who can see the class: a price has to be visible to be paid.
drop policy if exists "public read session tiers" on public.session_tiers;
create policy "public read session tiers"
  on public.session_tiers for select
  to anon, authenticated
  using (true);

drop policy if exists "admin all on session tiers" on public.session_tiers;
create policy "admin all on session tiers"
  on public.session_tiers for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- ---------------------------------------------------------------------------
-- Order lines.
--
-- 054 put the counts on the booking itself, which could only ever describe one
-- price. They move down a level so an order can hold "2 R adults" and "1 S
-- child" at once and still be one payment and one ticket.
--
-- tier_id null means the class has no tiers and the line is priced from the
-- session — the same "null means there is no such thing" convention the child
-- rate already uses.
-- ---------------------------------------------------------------------------

create table if not exists public.booking_items (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  tier_id     uuid references public.session_tiers(id) on delete restrict,
  adult_count int not null default 0 check (adult_count >= 0),
  child_count int not null default 0 check (child_count >= 0),
  created_at  timestamptz not null default now(),

  constraint booking_items_not_empty check (adult_count + child_count >= 1),
  -- One line per tier: two lines for the same grade are the same line.
  -- NULLS NOT DISTINCT so the no-tier case cannot be duplicated either.
  constraint booking_items_tier_key unique nulls not distinct (booking_id, tier_id)
);

create index if not exists booking_items_booking_idx
  on public.booking_items (booking_id);
create index if not exists booking_items_tier_idx
  on public.booking_items (tier_id);

alter table public.booking_items enable row level security;

-- The counts used to be columns on bookings, so they were covered by that
-- table's policies. Now they are a separate table and need the same three
-- readers, or a member's own reservation comes back with no people on it.
drop policy if exists "admin all on booking items" on public.booking_items;
create policy "admin all on booking items"
  on public.booking_items for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

drop policy if exists "member read own booking items" on public.booking_items;
create policy "member read own booking items"
  on public.booking_items for select
  to authenticated
  using (exists (
    select 1 from public.bookings b
     where b.id = booking_items.booking_id
       and b.user_id = auth.uid()
  ));

drop policy if exists "teacher read own session booking items" on public.booking_items;
create policy "teacher read own session booking items"
  on public.booking_items for select
  to authenticated
  using (public.is_teacher_user() and exists (
    select 1
      from public.bookings b
      join public.sessions s on s.id = b.session_id
     where b.id = booking_items.booking_id
       and s.instructor_id = public.my_partner_id()
  ));

-- Carry 054's counts down into a line before the columns go. Guarded on the
-- columns still being there so re-running this file is not an error.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'bookings'
       and column_name = 'adult_count'
  ) then
    insert into public.booking_items (booking_id, tier_id, adult_count, child_count)
    select b.id, null, b.adult_count, b.child_count
      from public.bookings b
     where b.adult_count + b.child_count >= 1
       and not exists (
         select 1 from public.booking_items i where i.booking_id = b.id
       );
  end if;
end $$;

-- 054's trigger names these columns in its UPDATE OF list, so it holds them
-- open. Recreated further down against the columns that remain.
drop trigger if exists bookings_sync_session_seats on public.bookings;

alter table public.bookings drop constraint if exists bookings_party_counts_check;
alter table public.bookings drop column if exists adult_count;
alter table public.bookings drop column if exists child_count;

-- ---------------------------------------------------------------------------
-- A class's capacity is its tiers' capacity.
--
-- Derived rather than entered twice. Every screen that shows "8 spots left"
-- reads sessions.capacity, and none of them should have to learn about tiers
-- to keep being right.
-- ---------------------------------------------------------------------------

create or replace function public.sync_session_capacity(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total int;
begin
  select sum(capacity) into v_total
    from public.session_tiers where session_id = p_session_id;

  -- No tiers: the session keeps whatever capacity an admin set by hand.
  if v_total is null then
    return;
  end if;

  update public.sessions set capacity = v_total where id = p_session_id;
end;
$$;

create or replace function public.session_tiers_sync_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_session_capacity(old.session_id);
    return old;
  end if;
  if tg_op = 'UPDATE' and new.session_id is distinct from old.session_id then
    perform public.sync_session_capacity(old.session_id);
  end if;
  perform public.sync_session_capacity(new.session_id);
  return new;
end;
$$;

drop trigger if exists session_tiers_capacity on public.session_tiers;
create trigger session_tiers_capacity
  after insert or delete or update of capacity, session_id
  on public.session_tiers
  for each row execute function public.session_tiers_sync_capacity();

-- ---------------------------------------------------------------------------
-- Seats, recounted from the lines.
--
-- 054 moved this off the six callers that used to maintain it by hand; the
-- same function now also fills in each tier's own count, so per-grade
-- availability comes from the same place as the class total and cannot
-- disagree with it.
-- ---------------------------------------------------------------------------

create or replace function public.recount_session_seats(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sessions s
     set booked_count = coalesce((
           select sum(i.adult_count + i.child_count)
             from public.booking_items i
             join public.bookings b on b.id = i.booking_id
            where b.session_id = s.id
              and (b.status = 'confirmed' or public.is_booking_hold_active(b))
         ), 0)
   where s.id = p_session_id;

  update public.session_tiers t
     set booked_count = coalesce((
           select sum(i.adult_count + i.child_count)
             from public.booking_items i
             join public.bookings b on b.id = i.booking_id
            where i.tier_id = t.id
              and (b.status = 'confirmed' or public.is_booking_hold_active(b))
         ), 0)
   where t.session_id = p_session_id;
end;
$$;

-- The counts live on booking_items but the status that makes them count lives
-- on bookings, so both tables have to wake the recount.
create or replace function public.booking_items_sync_seats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session_id uuid;
begin
  select session_id into v_session_id
    from public.bookings
   where id = case when tg_op = 'DELETE' then old.booking_id else new.booking_id end;

  if v_session_id is not null then
    perform public.recount_session_seats(v_session_id);
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists booking_items_sync_seats on public.booking_items;
create trigger booking_items_sync_seats
  after insert or delete or update of adult_count, child_count, tier_id, booking_id
  on public.booking_items
  for each row execute function public.booking_items_sync_seats();

create trigger bookings_sync_session_seats
  after insert or delete or update of status, session_id, expires_at
  on public.bookings
  for each row execute function public.sync_session_seats();

-- ---------------------------------------------------------------------------
-- Reading an order out of JSON.
--
-- The RPCs take the lines as jsonb: a variable-length list of (tier, adults,
-- children) does not fit in scalar arguments, and PostgREST passes jsonb
-- cleanly. Nothing here trusts it — every tier is checked against the session
-- and every price is looked up, not read from the request.
-- ---------------------------------------------------------------------------

create or replace function public.booking_item_rows(p_items jsonb)
returns table (tier_id uuid, adult_count int, child_count int)
language sql
immutable
as $$
  select nullif(e->>'tier_id', '')::uuid,
         coalesce((e->>'adults')::int, 0),
         coalesce((e->>'children')::int, 0)
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e;
$$;

-- What an order costs, each rate discounted and rounded per person before
-- multiplying, then summed across the lines. Mirrors quoteOrder() in
-- lib/payments/money.ts.
create or replace function public.order_total(
  p_session_id uuid,
  p_items jsonb
)
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    public.party_total(
      coalesce(t.price_amount, s.price_amount),
      case when i.tier_id is null then s.child_price_amount else t.child_price_amount end,
      s.price_currency, s.discount_type, s.discount_value,
      i.adult_count, i.child_count
    )
  ), 0)
  from public.booking_item_rows(p_items) i
  join public.sessions s on s.id = p_session_id
  left join public.session_tiers t on t.id = i.tier_id;
$$;

-- The same order with no discount at all — what a coupon comes off.
create or replace function public.order_list_total(
  p_session_id uuid,
  p_items jsonb
)
returns numeric
language sql
stable
as $$
  select coalesce(sum(
    public.party_list_total(
      coalesce(t.price_amount, s.price_amount),
      case when i.tier_id is null then s.child_price_amount else t.child_price_amount end,
      i.adult_count, i.child_count
    )
  ), 0)
  from public.booking_item_rows(p_items) i
  join public.sessions s on s.id = p_session_id
  left join public.session_tiers t on t.id = i.tier_id;
$$;

/**
 * Everything that can be wrong with an order, in one place.
 *
 * Both booking functions need the identical checks, and a rule enforced in two
 * bodies is a rule that eventually differs between them. Returns null when the
 * order is fine, or the message to raise.
 */
create or replace function public.validate_booking_items(
  p_session_id uuid,
  p_items jsonb
)
returns text
language plpgsql
stable
set search_path = public
as $$
declare
  v_has_tiers boolean;
  v_party int;
  v_row record;
begin
  select exists (select 1 from public.session_tiers where session_id = p_session_id)
    into v_has_tiers;

  select coalesce(sum(adult_count + child_count), 0) into v_party
    from public.booking_item_rows(p_items);

  if v_party < 1 then
    return 'A booking needs at least one person.';
  end if;
  if v_party > 10 then
    return 'Up to 10 people per booking. Please contact us for a larger group.';
  end if;

  for v_row in select * from public.booking_item_rows(p_items) loop
    if v_row.adult_count < 0 or v_row.child_count < 0 then
      return 'Party counts cannot be negative.';
    end if;

    if v_has_tiers and v_row.tier_id is null then
      return 'Choose a seat tier.';
    end if;
    if not v_has_tiers and v_row.tier_id is not null then
      return 'This class does not have seat tiers.';
    end if;

    if v_row.tier_id is not null then
      if not exists (
        select 1 from public.session_tiers
         where id = v_row.tier_id and session_id = p_session_id
      ) then
        return 'That seat tier is not part of this class.';
      end if;

      if v_row.child_count > 0 and not exists (
        select 1 from public.session_tiers
         where id = v_row.tier_id and child_price_amount is not null
      ) then
        return 'That seat tier does not offer a child rate.';
      end if;

      -- Availability is per grade: selling out R does not free up S.
      if exists (
        select 1 from public.session_tiers
         where id = v_row.tier_id
           and booked_count + v_row.adult_count + v_row.child_count > capacity
      ) then
        return 'Not enough seats left in that tier.';
      end if;
    else
      if v_row.child_count > 0 and not exists (
        select 1 from public.sessions
         where id = p_session_id and child_price_amount is not null
      ) then
        return 'This class does not offer a child rate.';
      end if;
    end if;
  end loop;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- check_coupon: measured against the order.
-- ---------------------------------------------------------------------------

create or replace function public.check_coupon(
  p_code text,
  p_session_id uuid,
  p_email text default null,
  p_lock boolean default false,
  p_items jsonb default null
)
returns table (
  ok boolean,
  reason text,
  coupon_id uuid,
  final_amount numeric,
  discount_amount numeric
)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_coupon public.coupons%rowtype;
  v_session public.sessions%rowtype;
  v_email text;
  v_used int;
  v_used_by_user int;
  v_items jsonb;
  v_list_total numeric;
  v_session_final numeric;
  v_coupon_final numeric;
  v_best numeric;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return query select false, 'session_not_found', null::uuid, null::numeric, null::numeric;
    return;
  end if;

  -- No lines given means the plain single-adult case, which is what the
  -- callers that predate tiers ask about.
  v_items := coalesce(p_items, '[{"adults":1,"children":0}]'::jsonb);

  v_list_total := public.order_list_total(p_session_id, v_items);
  -- The price to beat: what the order already costs after the session's own
  -- discount. A coupon that cannot beat it is not applied.
  v_session_final := public.order_total(p_session_id, v_items);

  if p_lock then
    select * into v_coupon from public.coupons
    where upper(btrim(code)) = upper(btrim(p_code))
    for update;
  else
    select * into v_coupon from public.coupons
    where upper(btrim(code)) = upper(btrim(p_code));
  end if;

  if not found then
    return query select false, 'not_found', null::uuid, v_session_final, 0::numeric;
    return;
  end if;

  if not v_coupon.is_active then
    return query select false, 'inactive', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.starts_at is not null and now() < v_coupon.starts_at then
    return query select false, 'not_started', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.ends_at is not null and now() > v_coupon.ends_at then
    return query select false, 'expired', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.session_id is not null and v_coupon.session_id <> p_session_id then
    return query select false, 'not_applicable', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.experience_id is not null
     and v_coupon.experience_id is distinct from v_session.experience_id then
    return query select false, 'not_applicable', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.discount_type = 'fixed'
     and v_coupon.currency is distinct from v_session.price_currency then
    return query select false, 'currency_mismatch', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  if v_coupon.max_redemptions is not null then
    select count(*) into v_used
    from public.coupon_redemptions cr where cr.coupon_id = v_coupon.id;
    if v_used >= v_coupon.max_redemptions then
      return query select false, 'limit_reached', v_coupon.id, v_session_final, 0::numeric;
      return;
    end if;
  end if;

  v_email := public.normalize_email(coalesce(p_email, ''));
  if v_coupon.max_per_user is not null and v_email <> '' then
    select count(*) into v_used_by_user
    from public.coupon_redemptions cr
    where cr.coupon_id = v_coupon.id and cr.email = v_email;
    if v_used_by_user >= v_coupon.max_per_user then
      return query select false, 'user_limit_reached', v_coupon.id, v_session_final, 0::numeric;
      return;
    end if;
  end if;

  v_coupon_final := public.session_final_price(
    v_list_total, v_session.price_currency,
    v_coupon.discount_type, v_coupon.discount_value
  );
  v_best := least(v_session_final, v_coupon_final);

  if v_best >= v_session_final then
    return query select false, 'not_better', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  return query select true, null::text, v_coupon.id, v_best, (v_session_final - v_best);
end;
$$;

comment on function public.check_coupon(text, uuid, text, boolean, jsonb) is
  'Validate a coupon against a session and an order. The coupon applies once to the order and competes with the session discount; it never stacks. Returns ok=false with a machine-readable reason rather than raising.';

drop function if exists public.check_coupon(text, uuid, text, boolean, int, int);

revoke all on function public.check_coupon(text, uuid, text, boolean, jsonb) from public;
revoke all on function public.check_coupon(text, uuid, text, boolean, jsonb) from anon;
revoke all on function public.check_coupon(text, uuid, text, boolean, jsonb) from authenticated;
grant execute on function public.check_coupon(text, uuid, text, boolean, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Booking RPCs take an order.
-- ---------------------------------------------------------------------------

create or replace function public.create_booking(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_coupon_code text default null,
  p_items jsonb default null
)
returns table(booking_id uuid, cancel_token text)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_session public.sessions%rowtype;
  v_email text;
  v_booking_id uuid;
  v_cancel_token text;
  v_items jsonb;
  v_party int;
  v_problem text;
  v_amount numeric;
  v_coupon record;
  -- A plpgsql record stays unassigned until a SELECT INTO touches it, and
  -- reading a field of an unassigned record raises. Without a separate flag,
  -- every booking made WITHOUT a coupon fails at the redemption check (040).
  v_has_coupon boolean := false;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
  end if;

  v_items := coalesce(p_items, '[{"adults":1,"children":0}]'::jsonb);

  -- Locked before the order is validated: the tier counts it checks are the
  -- ones another booking would be changing.
  select * into v_session from public.sessions where id = p_session_id for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  v_problem := public.validate_booking_items(p_session_id, v_items);
  if v_problem is not null then
    raise exception '%', v_problem;
  end if;

  select coalesce(sum(adult_count + child_count), 0) into v_party
    from public.booking_item_rows(v_items);

  v_amount := public.order_total(p_session_id, v_items);

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(p_coupon_code, p_session_id, v_email, true, v_items);
    -- 'not_better' is not a failure: the class is already cheaper than the
    -- coupon would make it, so book at that price rather than refusing a
    -- customer who would have paid less anyway.
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
      v_has_coupon := true;
      v_amount := v_coupon.final_amount;
    end if;
  end if;

  if v_amount > 0 and v_session.price_currency = 'USD' then
    raise exception 'Online payment required. Use create_booking_hold instead.';
  end if;

  if v_session.booked_count + v_party > v_session.capacity then
    raise exception 'Not enough spots left for % people.', v_party;
  end if;

  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and (b.status = 'confirmed' or public.is_booking_hold_active(b))
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  insert into public.bookings
    (session_id, user_id, guest_name, guest_email, guest_phone)
  values
    (p_session_id, p_user_id, trim(p_guest_name), v_email,
     nullif(trim(p_guest_phone), ''))
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  insert into public.booking_items (booking_id, tier_id, adult_count, child_count)
  select v_booking_id, i.tier_id, i.adult_count, i.child_count
    from public.booking_item_rows(v_items) i
   where i.adult_count + i.child_count > 0;

  if v_has_coupon then
    insert into public.coupon_redemptions
      (coupon_id, booking_id, user_id, email, amount_discounted)
    values
      (v_coupon.coupon_id, v_booking_id, p_user_id, v_email, v_coupon.discount_amount);
  end if;

  -- Money is owed but not yet collected: pending until an admin records it (040).
  if v_amount > 0 then
    insert into public.payments (
      booking_id, merchant_uid, pg_provider, amount, currency, status
    )
    values (
      v_booking_id,
      'twk-' || replace(gen_random_uuid()::text, '-', ''),
      'onsite',
      v_amount,
      v_session.price_currency,
      'pending'
    );
  end if;

  return query select v_booking_id, v_cancel_token;
end;
$function$;

create or replace function public.create_booking_hold(
  p_session_id uuid,
  p_guest_name text,
  p_guest_email text,
  p_guest_phone text default null,
  p_user_id uuid default null,
  p_pg_provider text default 'portone',
  p_hold_minutes integer default 10,
  p_coupon_code text default null,
  p_items jsonb default null
)
returns table(
  booking_id uuid,
  cancel_token text,
  merchant_uid text,
  amount numeric,
  expires_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_session public.sessions%rowtype;
  v_email text;
  v_booking_id uuid;
  v_cancel_token text;
  v_merchant_uid text;
  v_expires timestamptz;
  v_items jsonb;
  v_party int;
  v_problem text;
  v_amount numeric;
  v_coupon record;
  v_has_coupon boolean := false;
begin
  v_email := public.normalize_email(p_guest_email);

  if v_email = '' or trim(p_guest_name) = '' then
    raise exception 'Name and email are required.';
  end if;

  if p_hold_minutes < 1 or p_hold_minutes > 60 then
    raise exception 'Hold minutes must be between 1 and 60.';
  end if;

  if trim(p_pg_provider) = '' then
    raise exception 'pg_provider is required.';
  end if;

  v_items := coalesce(p_items, '[{"adults":1,"children":0}]'::jsonb);

  select * into v_session from public.sessions where id = p_session_id for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.status <> 'confirmed' or not v_session.is_published then
    raise exception 'Session is not available for booking.';
  end if;

  if v_session.starts_at <= now() then
    raise exception 'Session has already started or ended.';
  end if;

  v_problem := public.validate_booking_items(p_session_id, v_items);
  if v_problem is not null then
    raise exception '%', v_problem;
  end if;

  select coalesce(sum(adult_count + child_count), 0) into v_party
    from public.booking_item_rows(v_items);

  v_amount := public.order_total(p_session_id, v_items);

  if nullif(btrim(coalesce(p_coupon_code, '')), '') is not null then
    select * into v_coupon
    from public.check_coupon(p_coupon_code, p_session_id, v_email, true, v_items);
    if not v_coupon.ok and v_coupon.reason is distinct from 'not_better' then
      raise exception 'Coupon cannot be used: %', v_coupon.reason;
    end if;
    if v_coupon.ok then
      v_has_coupon := true;
      v_amount := v_coupon.final_amount;
    end if;
  end if;

  -- Guard on what is actually charged: a free tier, a coupon, or a full
  -- discount all make this free, and a free booking goes through
  -- create_booking instead.
  if v_amount <= 0 then
    raise exception 'This session does not require online payment. Use create_booking instead.';
  end if;

  if v_session.booked_count + v_party > v_session.capacity then
    raise exception 'Not enough spots left for % people.', v_party;
  end if;

  if exists (
    select 1 from public.bookings b
    where b.session_id = p_session_id
      and (b.status = 'confirmed' or public.is_booking_hold_active(b))
      and (b.guest_email = v_email or (p_user_id is not null and b.user_id = p_user_id))
  ) then
    raise exception 'You already have a booking for this session.';
  end if;

  v_expires := now() + make_interval(mins => p_hold_minutes);
  v_merchant_uid := 'twk-' || replace(gen_random_uuid()::text, '-', '');

  insert into public.bookings (
    session_id, user_id, guest_name, guest_email, guest_phone, status, expires_at
  )
  values (
    p_session_id, p_user_id, trim(p_guest_name), v_email,
    nullif(trim(p_guest_phone), ''), 'pending_payment', v_expires
  )
  returning public.bookings.id, public.bookings.cancel_token
  into v_booking_id, v_cancel_token;

  insert into public.booking_items (booking_id, tier_id, adult_count, child_count)
  select v_booking_id, i.tier_id, i.adult_count, i.child_count
    from public.booking_item_rows(v_items) i
   where i.adult_count + i.child_count > 0;

  if v_has_coupon then
    insert into public.coupon_redemptions
      (coupon_id, booking_id, user_id, email, amount_discounted)
    values
      (v_coupon.coupon_id, v_booking_id, p_user_id, v_email, v_coupon.discount_amount);
  end if;

  insert into public.payments (
    booking_id, merchant_uid, pg_provider, amount, currency, status
  )
  values (
    v_booking_id, v_merchant_uid, trim(p_pg_provider),
    v_amount, v_session.price_currency, 'pending'
  );

  return query
  select v_booking_id, v_cancel_token, v_merchant_uid, v_amount, v_expires;
end;
$function$;

-- 054's signatures took two counts; they would otherwise be picked by
-- name-matched calls and book one line for a multi-tier order.
drop function if exists public.create_booking(uuid, text, text, text, uuid, text, int, int);
drop function if exists public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, int, int);

revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, jsonb) from public;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, jsonb) from anon;
revoke all on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, jsonb) from authenticated;
grant execute on function public.create_booking_hold(uuid, text, text, text, uuid, text, integer, text, jsonb)
  to service_role;

grant execute on function public.create_booking(uuid, text, text, text, uuid, text, jsonb)
  to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Replacing a class's tiers.
--
-- One call rather than per-row writes: tiers are edited as a set on the
-- session form, and a partial save would leave a class priced half one way and
-- half the other. A tier that has already sold seats is updated in place, not
-- deleted and recreated, so existing bookings keep pointing at it — and one
-- that has sold seats cannot be removed at all.
-- ---------------------------------------------------------------------------

create or replace function public.set_session_tiers(
  p_session_id uuid,
  p_tiers jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
  v_keep uuid[] := '{}';
  v_id uuid;
begin
  if not public.is_admin_user() then
    raise exception 'Admin access required.';
  end if;

  if not exists (select 1 from public.sessions where id = p_session_id) then
    raise exception 'Session not found.';
  end if;

  -- Introducing tiers into a class that already sold tier-less seats leaves
  -- half its bookings outside the per-tier counts: the class would say five
  -- seats gone and every tier would say none. Those bookings cannot be
  -- assigned a grade automatically — nobody knows which one they paid for.
  if jsonb_array_length(coalesce(p_tiers, '[]'::jsonb)) > 0
     and not exists (select 1 from public.session_tiers where session_id = p_session_id)
     and exists (
       select 1
         from public.booking_items i
         join public.bookings b on b.id = i.booking_id
        where b.session_id = p_session_id
          and i.tier_id is null
          and (b.status = 'confirmed' or public.is_booking_hold_active(b))
     ) then
    raise exception 'This class already has bookings at a single price. Seat tiers can only be added before anyone books.';
  end if;

  for v_row in
    select nullif(e->>'id', '')::uuid          as id,
           btrim(coalesce(e->>'code', ''))     as code,
           nullif(btrim(coalesce(e->>'name', '')), '') as name,
           coalesce((e->>'capacity')::int, 0)  as capacity,
           coalesce((e->>'price_amount')::numeric, 0) as price_amount,
           nullif(e->>'child_price_amount', '')::numeric as child_price_amount,
           coalesce((e->>'sort_order')::int, 0) as sort_order
      from jsonb_array_elements(coalesce(p_tiers, '[]'::jsonb)) e
  loop
    if v_row.code = '' then
      raise exception 'Every tier needs a name.';
    end if;
    if v_row.capacity < 1 then
      raise exception 'Tier "%" needs a capacity of at least 1.', v_row.code;
    end if;
    if v_row.price_amount < 0 or coalesce(v_row.child_price_amount, 0) < 0 then
      raise exception 'Tier "%" cannot have a negative price.', v_row.code;
    end if;

    if v_row.id is not null then
      update public.session_tiers
         set code = v_row.code,
             name = v_row.name,
             capacity = v_row.capacity,
             price_amount = v_row.price_amount,
             child_price_amount = v_row.child_price_amount,
             sort_order = v_row.sort_order
       where id = v_row.id and session_id = p_session_id
      returning id into v_id;

      if v_id is null then
        raise exception 'That tier is not part of this class.';
      end if;
    else
      insert into public.session_tiers
        (session_id, code, name, capacity, price_amount, child_price_amount, sort_order)
      values
        (p_session_id, v_row.code, v_row.name, v_row.capacity,
         v_row.price_amount, v_row.child_price_amount, v_row.sort_order)
      returning id into v_id;
    end if;

    v_keep := v_keep || v_id;
  end loop;

  -- Anything left out of the list is being removed, which is only allowed
  -- while nobody holds a seat in it.
  if exists (
    select 1 from public.session_tiers t
     where t.session_id = p_session_id
       and not (t.id = any(v_keep))
       and t.booked_count > 0
  ) then
    raise exception 'A tier with bookings cannot be removed.';
  end if;

  delete from public.session_tiers t
   where t.session_id = p_session_id
     and not (t.id = any(v_keep));

  perform public.sync_session_capacity(p_session_id);
end;
$$;

comment on function public.set_session_tiers is
  'Replaces a class''s seat tiers in one call. Tiers that already have bookings are updated in place and cannot be removed.';

revoke all on function public.set_session_tiers(uuid, jsonb) from public;
revoke all on function public.set_session_tiers(uuid, jsonb) from anon;
grant execute on function public.set_session_tiers(uuid, jsonb) to authenticated, service_role;

-- Bring every count in line with the rule the triggers now enforce.
select public.recount_session_seats(id) from public.sessions;
