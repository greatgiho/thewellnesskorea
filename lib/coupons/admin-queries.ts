import type { SupabaseClient } from "@supabase/supabase-js"
import { money, type Money } from "@/lib/payments/money"
import type { DiscountType } from "@/lib/payments/money"

/**
 * Admin views over coupons.
 *
 * Reads go through the admin's own client: `coupons` and `coupon_redemptions`
 * are admin-only at the RLS layer, so nothing here needs the service key.
 */

export type CouponRow = {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  currency: string | null
  experienceId: string | null
  sessionId: string | null
  startsAt: string | null
  endsAt: string | null
  maxRedemptions: number | null
  maxPerUser: number | null
  isActive: boolean
  note: string | null
  createdAt: string
}

export type CouponWithUsage = CouponRow & {
  redemptions: number
  /** Total discounted, per currency — a coupon can span both. */
  totalDiscounted: Money[]
}

export type CouponRedemption = {
  id: string
  email: string
  amountDiscounted: number
  createdAt: string
  bookingId: string
  bookingStatus: string | null
  sessionTitle: string | null
  currency: string | null
}

type RawCoupon = {
  id: string
  code: string
  discount_type: DiscountType
  discount_value: number | string
  currency: string | null
  experience_id: string | null
  session_id: string | null
  starts_at: string | null
  ends_at: string | null
  max_redemptions: number | null
  max_per_user: number | null
  is_active: boolean
  note: string | null
  created_at: string
}

const COUPON_SELECT =
  "id, code, discount_type, discount_value, currency, experience_id, session_id, starts_at, ends_at, max_redemptions, max_per_user, is_active, note, created_at"

function mapCoupon(row: RawCoupon): CouponRow {
  return {
    id: row.id,
    code: row.code,
    discountType: row.discount_type,
    discountValue: Number(row.discount_value),
    currency: row.currency,
    experienceId: row.experience_id,
    sessionId: row.session_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    maxRedemptions: row.max_redemptions,
    maxPerUser: row.max_per_user,
    isActive: row.is_active,
    note: row.note,
    createdAt: row.created_at,
  }
}

export async function getCoupons(
  supabase: SupabaseClient,
  search?: string,
): Promise<CouponWithUsage[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  const coupons = ((data ?? []) as RawCoupon[]).map(mapCoupon)
  if (coupons.length === 0) return []

  // One query for every redemption rather than one per coupon: the usage
  // column is on the list, so per-row queries would scale with the table.
  const { data: reds, error: redError } = await supabase
    .from("coupon_redemptions")
    .select("coupon_id, amount_discounted, bookings ( sessions ( price_currency ) )")
    .in(
      "coupon_id",
      coupons.map((c) => c.id),
    )

  if (redError) throw new Error(redError.message)

  const counts = new Map<string, number>()
  const totals = new Map<string, Map<string, number>>()
  for (const row of (reds ?? []) as {
    coupon_id: string
    amount_discounted: number | string
    bookings?: {
      sessions?: { price_currency?: string } | { price_currency?: string }[] | null
    } | null
  }[]) {
    counts.set(row.coupon_id, (counts.get(row.coupon_id) ?? 0) + 1)
    // Group by the class currency rather than the coupon's: a percentage
    // coupon has no currency of its own, and a free booking has no payment
    // row to read one from.
    const session = Array.isArray(row.bookings?.sessions)
      ? row.bookings?.sessions[0]
      : row.bookings?.sessions
    const currency = session?.price_currency ?? "USD"
    const byCurrency = totals.get(row.coupon_id) ?? new Map<string, number>()
    byCurrency.set(
      currency,
      (byCurrency.get(currency) ?? 0) + Number(row.amount_discounted),
    )
    totals.set(row.coupon_id, byCurrency)
  }

  const items = coupons.map((coupon) => ({
    ...coupon,
    redemptions: counts.get(coupon.id) ?? 0,
    totalDiscounted: [...(totals.get(coupon.id) ?? new Map()).entries()].map(
      ([currency, amount]) => money(currency, amount),
    ),
  }))

  const q = search?.trim().toLowerCase()
  if (!q) return items
  return items.filter(
    (c) =>
      c.code.toLowerCase().includes(q) ||
      (c.note?.toLowerCase().includes(q) ?? false),
  )
}

export async function getCoupon(
  supabase: SupabaseClient,
  id: string,
): Promise<CouponRow | null> {
  const { data, error } = await supabase
    .from("coupons")
    .select(COUPON_SELECT)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data ? mapCoupon(data as RawCoupon) : null
}

export async function getCouponRedemptions(
  supabase: SupabaseClient,
  couponId: string,
): Promise<CouponRedemption[]> {
  const { data, error } = await supabase
    .from("coupon_redemptions")
    .select(
      `
      id, email, amount_discounted, created_at, booking_id,
      bookings ( status, sessions ( title, price_currency ) )
    `,
    )
    .eq("coupon_id", couponId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return ((data ?? []) as unknown as {
    id: string
    email: string
    amount_discounted: number | string
    created_at: string
    booking_id: string
    bookings?: {
      status?: string
      sessions?: { title?: string; price_currency?: string } | { title?: string; price_currency?: string }[] | null
    } | null
  }[]).map((row) => {
    const session = Array.isArray(row.bookings?.sessions)
      ? row.bookings?.sessions[0]
      : row.bookings?.sessions
    return {
      id: row.id,
      email: row.email,
      amountDiscounted: Number(row.amount_discounted),
      createdAt: row.created_at,
      bookingId: row.booking_id,
      bookingStatus: row.bookings?.status ?? null,
      sessionTitle: session?.title ?? null,
      currency: session?.price_currency ?? null,
    }
  })
}
