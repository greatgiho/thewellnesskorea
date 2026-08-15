-- Let the class say how it is paid for, instead of inferring it from currency.
--
-- Until now the rule was derived: a USD price meant online, anything else meant
-- pay at the studio. That was never a decision anybody made — it was PayPal not
-- taking won, wearing the clothes of a policy. Adding Toss made won payable
-- online too, and in doing so quietly removed the on-site route that had been
-- the only way a foreign visitor could pay for a won-priced class: their card
-- is not issued in Korea, 국내일반결제 will not authorise it, and there was no
-- longer a "pay when you arrive" to fall back to.
--
-- So the choice becomes explicit. 'onsite' means reserve now and pay in person,
-- whatever the price is in. 'online' means take the money now if there is a
-- processor that can — a class priced in a currency neither PayPal nor Toss
-- handles still falls back to on-site rather than offering a payment nobody can
-- complete.
--
-- Defaulting to 'online' rather than 'auto' or 'onsite' because that is what
-- every existing row already does today, with Toss configured. A default that
-- changed live behaviour on deploy would be the second time this month that a
-- pricing rule moved without anyone asking for it.

alter table public.sessions
  add column if not exists payment_method text not null default 'online';

alter table public.sessions
  drop constraint if exists sessions_payment_method_check;

alter table public.sessions
  add constraint sessions_payment_method_check
  check (payment_method in ('online', 'onsite'));

comment on column public.sessions.payment_method is
  'online = take payment now when a processor supports the currency; onsite = always pay in person.';
