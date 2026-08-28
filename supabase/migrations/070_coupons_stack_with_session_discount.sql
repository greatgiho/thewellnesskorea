-- Let a coupon stack with the class's own discount.
--
-- 038 made them compete: the coupon was priced off the list total, the better
-- of the two won, and a coupon that could not beat the session discount was
-- refused outright as 'not_better'. The reasoning was that "50% and 50%" reads
-- as 75% off only once it is on an invoice.
--
-- That reasoning holds for two offers aimed at the same person. It does not
-- hold for what these two things have become. A session discount is a price
-- the class is being sold at — everyone booking it pays that. A coupon is
-- something handed to one person. Making them exclusive means the moment a
-- class goes on sale, every invitation already given out silently stops
-- working, and nothing on any screen says so.
--
-- So they stack, sequentially: the session discount sets the price, and the
-- coupon comes off what is left.
--
--   ₩100,000, session −30%, coupon −50%
--     before   ₩50,000   (coupon off list, beats the session discount)
--     after    ₩35,000   (100,000 × 0.7 × 0.5)
--
-- Sequential rather than additive on purpose. Two rates summed can pass 100%
-- and need a separate guard against a negative price; composed, they cannot.
-- A fixed coupon likewise comes off the discounted total, so it cannot quietly
-- turn into a larger discount than it says on a class that is already reduced.
--
-- Only check_coupon changes. create_booking calls it under a lock and stores
-- what it returns, so the quote a customer is shown and the amount they are
-- charged move together by construction.

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
  v_session_final numeric;
  v_coupon_final numeric;
begin
  select * into v_session from public.sessions where id = p_session_id;
  if not found then
    return query select false, 'session_not_found', null::uuid, null::numeric, null::numeric;
    return;
  end if;

  -- No lines given means the plain single-adult case, which is what the
  -- callers that predate tiers ask about.
  v_items := coalesce(p_items, '[{"adults":1,"children":0}]'::jsonb);

  -- What the order costs after the session's own discount. The coupon now
  -- comes off this rather than off the list price — see the header.
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

  -- Applied to the discounted total, not the list price. session_final_price
  -- clamps at zero, so a fixed coupon larger than what is left takes the order
  -- to free rather than negative.
  v_coupon_final := public.session_final_price(
    v_session_final, v_session.price_currency,
    v_coupon.discount_type, v_coupon.discount_value
  );

  -- 'not_better' now means only what it says: this code takes nothing off.
  -- A coupon on an order that is already free, or one worth zero against this
  -- currency's rounding, is refused rather than recorded as a redemption that
  -- discounted nothing — the cap it burns is real even when the discount is not.
  if v_coupon_final >= v_session_final then
    return query select false, 'not_better', v_coupon.id, v_session_final, 0::numeric;
    return;
  end if;

  return query select true, null::text, v_coupon.id, v_coupon_final,
                      (v_session_final - v_coupon_final);
end;
$$;


comment on function public.check_coupon(text, uuid, text, boolean, jsonb) is
  'Validate a coupon against a session and an order. The coupon comes off the order total AFTER the session discount, so the two stack sequentially (070). Returns ok=false with a machine-readable reason rather than raising; ok=false/not_better now means the code takes nothing off, not that it lost a comparison. Pass p_lock=true inside a booking transaction to hold the coupon row while the usage limit is checked.';
