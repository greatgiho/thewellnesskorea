-- Where to send a bank transfer.
--
-- Won-priced classes have had no way to pay online since Toss was suspended:
-- onlineProviderFor('KRW') returns null, so the booking falls back to "pay at
-- the studio" and the customer leaves with nothing to act on. An account
-- number is the thing they can act on.
--
-- On site_settings rather than in code for the same reasons 056 gave: it is
-- edited by whoever owns the business, not by whoever deploys, and a mistyped
-- account number must be fixable in a minute rather than a release. It is also
-- the one value here where a typo sends somebody's money to a stranger.
--
-- Three columns rather than one line of text. The holder is not the bank and
-- the bank is not the number, and a screen that wants to show "우리은행" beside
-- a copy button for the digits cannot get them out of one string.

alter table public.site_settings
  add column if not exists bank_name text not null default '',
  add column if not exists bank_account_number text not null default '',
  add column if not exists bank_account_holder text not null default '';

comment on column public.site_settings.bank_name is
  'Bank for transfers, e.g. 우리은행. Blank hides the transfer details entirely.';
comment on column public.site_settings.bank_account_number is
  'Account number as it should be typed into a banking app.';
comment on column public.site_settings.bank_account_holder is
  'Whose name the transfer must be made out to — checked by the sender before they confirm.';
