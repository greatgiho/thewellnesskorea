-- Who paid, from PayPal, instead of who said their name was.
--
-- The counter asked for a nickname before the QR went up, because a row needs
-- something to be called by. But PayPal already knows who is paying, and it
-- knows better than a person typing at a queue: for a wallet payment the
-- capture comes back with the account's own name, email and id.
--
-- So the nickname stops being required. Tap a price, show the QR, and the name
-- arrives with the money.
--
-- It does not always arrive. A guest paying by card has no PayPal account, and
-- what comes back then is the card's brand and last four — enough to find the
-- sale for a refund, not enough to call out. That is why the nickname stays as
-- a field rather than being deleted: it is the fallback for the case PayPal
-- cannot answer, and the barista can still type one when they want to.
--
-- Nullable rather than defaulted to '': "nobody typed one" and "somebody typed
-- an empty one" would otherwise be the same value, and the display has to tell
-- them apart to know whether to fall back.

alter table public.beverage_orders alter column nickname drop not null;

alter table public.beverage_orders drop constraint if exists beverage_orders_nickname_check;
alter table public.beverage_orders
  add constraint beverage_orders_nickname_check
  check (nickname is null or btrim(nickname) <> '');

alter table public.beverage_orders
  -- What to call the customer: the PayPal account's name, or the name on the
  -- card. Null when the payment told us neither.
  add column if not exists payer_name text,
  -- The PayPal account's email. Not the same thing as a booking's email and
  -- not to be matched against one — it is whichever account paid.
  add column if not exists payer_email text,
  -- PayPal's own id for the account. Stable across their email changing, so it
  -- is the one to match on when someone comes back.
  add column if not exists payer_account_id text,
  -- For a guest card payment, already formatted for reading aloud across a
  -- counter: "VISA ····4242". One column because it is only ever displayed —
  -- nothing needs the brand and the digits apart.
  add column if not exists payer_card text;

comment on column public.beverage_orders.nickname is
  'Optional. What the customer said to call them; PayPal''s name is used when there is none.';
comment on column public.beverage_orders.payer_name is
  'From the PayPal capture — the account holder, or the name on the card. Null when neither was returned.';
comment on column public.beverage_orders.payer_account_id is
  'PayPal account id. Survives an email change, so this is what identifies a returning customer.';
comment on column public.beverage_orders.payer_card is
  'Formatted for a counter: "VISA ····4242". Only set for guest card payments, which have no PayPal account.';
