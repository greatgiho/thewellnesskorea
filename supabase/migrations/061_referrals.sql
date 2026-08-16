-- Who sent us a booking.
--
-- The question this answers is not "where did traffic come from" — analytics
-- answers that better and cheaper. It is "which of these paid bookings belongs
-- to which partner", asked because money is going to be split on the answer.
-- That has to be a first-party record we can show a partner line by line, and
-- reconcile against payments; an analytics report is neither.
--
-- No payout machinery here on purpose. Volumes are small enough that paying by
-- hand is faster than building it, and the rate and the period are the parts
-- most likely to change once the first partner reads their first statement.

create table if not exists public.referrers (
  id         uuid primary key default gen_random_uuid(),
  -- What goes in the link. Case-insensitively unique: a code handed out on
  -- paper comes back typed however the person felt, and REF-JIN and ref-jin
  -- being two different partners is a problem discovered at payout time.
  code       text not null,
  name       text not null,
  note       text not null default '',
  is_active  boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint referrers_code_format check (code ~ '^[A-Za-z0-9_-]{2,32}$')
);

create unique index if not exists referrers_code_key
  on public.referrers (lower(code));

drop trigger if exists referrers_updated_at on public.referrers;
create trigger referrers_updated_at
  before update on public.referrers
  for each row execute function public.set_updated_at();

alter table public.referrers enable row level security;

-- Read by anon as well as authenticated: the site has to check an incoming
-- ?ref= against this before it will stamp anything, and most visitors arriving
-- on a referral link are not signed in. A code and a name are what the partner
-- is handing out on a card anyway.
drop policy if exists "public read active referrers" on public.referrers;
create policy "public read active referrers"
  on public.referrers for select
  to anon, authenticated
  using (is_active);

drop policy if exists "admin all on referrers" on public.referrers;
create policy "admin all on referrers"
  on public.referrers for all
  to authenticated
  using (public.is_admin_user())
  with check (public.is_admin_user());

-- The attribution itself.
--
-- Text rather than a foreign key to referrers.id. A booking should keep saying
-- who sent it even if the referrer row is later renamed or removed, and a
-- statement covering last quarter must not change because someone edited a
-- partner this morning. The join for reporting is on lower(code), which is the
-- same thing the link carries.
alter table public.bookings
  add column if not exists referral_code text;

create index if not exists bookings_referral_code_idx
  on public.bookings (lower(referral_code))
  where referral_code is not null;

comment on column public.bookings.referral_code is
  'Referral code in effect when this booking was made. Copied, not referenced — a past statement must not change when a referrer row is edited.';
