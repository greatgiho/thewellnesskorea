-- PG requires new enum values to be committed before use in indexes/functions.
-- Run 022_online_payments.sql immediately after this migration.

alter type public.booking_status add value if not exists 'pending_payment';
