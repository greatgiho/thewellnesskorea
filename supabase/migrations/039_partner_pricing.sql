-- Partners set the price of their own classes.
--
-- Deliberately not an RLS update policy on sessions: RLS grants a whole row,
-- and an instructor who can update their session could also move it, resize
-- it, publish it, or cancel it. Pricing is the only thing being delegated, so
-- it goes through a definer function that writes exactly those four columns
-- and nothing else.
--
-- Ownership is checked against the caller's partner record rather than a
-- passed-in id, so a partner cannot price someone else's class.

create or replace function public.set_session_pricing(
  p_session_id uuid,
  p_price_currency text,
  p_price_amount numeric,
  p_discount_type text default null,
  p_discount_value numeric default null
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_partner_id uuid;
  v_session public.sessions%rowtype;
begin
  select id into v_partner_id
  from public.partners
  where user_id = auth.uid()
    and registration_status in ('admin', 'approved');

  if v_partner_id is null then
    raise exception 'Not a partner.';
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'Session not found.';
  end if;

  if v_session.instructor_id is distinct from v_partner_id then
    raise exception 'This class belongs to another instructor.';
  end if;

  if p_price_currency not in ('KRW', 'USD') then
    raise exception 'Unsupported currency.';
  end if;

  if p_price_amount is null or p_price_amount < 0 then
    raise exception 'Price cannot be negative.';
  end if;

  -- Mirror the column constraints so the partner gets a clear error rather
  -- than a constraint violation.
  if p_discount_type is not null then
    if p_discount_type not in ('fixed', 'percent') then
      raise exception 'Unknown discount type.';
    end if;
    if p_discount_value is null or p_discount_value <= 0 then
      raise exception 'Discount value must be greater than 0.';
    end if;
    if p_discount_type = 'percent' and p_discount_value > 100 then
      raise exception 'A percentage discount cannot exceed 100%%.';
    end if;
    if p_discount_type = 'fixed' and p_discount_value > p_price_amount then
      raise exception 'A fixed discount cannot exceed the price.';
    end if;
  elsif p_discount_value is not null then
    raise exception 'Choose a discount type or clear the value.';
  end if;

  update public.sessions
  set
    price_currency = p_price_currency,
    price_amount   = p_price_amount,
    discount_type  = p_discount_type,
    discount_value = case when p_discount_type is null then null else p_discount_value end
  where id = p_session_id;
end;
$$;

comment on function public.set_session_pricing is
  'Lets an instructor set price and discount on their own class. Definer rather than an RLS update policy because RLS cannot limit which columns are written, and everything else about a session stays admin-owned.';

revoke all on function public.set_session_pricing(uuid, text, numeric, text, numeric) from public;
revoke all on function public.set_session_pricing(uuid, text, numeric, text, numeric) from anon;
grant execute on function public.set_session_pricing(uuid, text, numeric, text, numeric)
  to authenticated, service_role;
