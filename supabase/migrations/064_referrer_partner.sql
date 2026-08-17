-- Tie a referrer to the partner it is.
--
-- A teacher who posts their own QR is a referrer like any other, but the two
-- rows have to know about each other: the partner screen needs to say whether
-- one exists yet, and the referral screen needs to list teachers whether or
-- not they have one. Matching on name would guess, and would guess wrong the
-- first time two people share a surname.
--
-- Null for the rest — a café, an Instagram account, a magazine. Those are not
-- partners and never will be.

alter table public.referrers
  add column if not exists partner_id uuid references public.partners(id) on delete set null;

-- One per partner. The teacher's QR is a single thing they hand out; a second
-- row for the same person would split their statement in half.
create unique index if not exists referrers_partner_key
  on public.referrers (partner_id)
  where partner_id is not null;

comment on column public.referrers.partner_id is
  'The partner this referrer is, if any. set null on delete — bookings keep the code as text, so a past statement must survive the partner row going away.';
