import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import { siteOrigin } from "@/lib/site-origin"
import { money, type Money } from "@/lib/payments/money"
import type { Drink } from "@/lib/drinks/menu"

/**
 * Counter sales: writing them down, finding them again, and settling them.
 *
 * Two different clients on purpose, and which one is used says who is asking:
 *
 *   - the admin screens read and write through the caller's own session, so
 *     RLS is what decides they may. Nothing here elevates that.
 *   - the customer's page and the capture that follows it use the service
 *     client, because nobody buying a drink is signed in. The order id in the
 *     URL is the credential, exactly as the ticket and cancel-by-token pages
 *     treat theirs.
 */

export type DrinkOrderStatus = "pending" | "paid" | "refunded"

export type DrinkOrder = {
  id: string
  nickname: string
  itemId: string
  itemName: string
  price: Money
  status: DrinkOrderStatus
  paypalCaptureId: string | null
  paidAt: string | null
  refundedAt: string | null
  createdAt: string
}

const COLUMNS =
  "id, nickname, item_id, item_name, amount, currency, status, paypal_capture_id, paid_at, refunded_at, created_at"

type Row = {
  id: string
  nickname: string
  item_id: string
  item_name: string
  amount: number | string
  currency: string
  status: DrinkOrderStatus
  paypal_capture_id: string | null
  paid_at: string | null
  refunded_at: string | null
  created_at: string
}

function toOrder(row: Row): DrinkOrder {
  return {
    id: row.id,
    nickname: row.nickname,
    itemId: row.item_id,
    itemName: row.item_name,
    // numeric comes back from PostgREST as a string; money() coerces it, and
    // this is the number a capture is checked against.
    price: money(row.currency, row.amount),
    status: row.status,
    paypalCaptureId: row.paypal_capture_id,
    paidAt: row.paid_at,
    refundedAt: row.refunded_at,
    createdAt: row.created_at,
  }
}

/** Where the QR on the counter screen sends whoever scans it. */
export function drinkOrderUrl(orderId: string): string {
  return new URL(`/drinks/${orderId}`, siteOrigin()).toString()
}

/**
 * Ring up one drink under a name.
 *
 * The price is copied off the menu here and never read from it again, so
 * editing lib/drinks/menu.ts cannot change what an order already on a screen
 * is asking for.
 */
export async function createDrinkOrder(
  supabase: SupabaseClient,
  input: { nickname: string; drink: Drink; createdBy: string },
): Promise<DrinkOrder> {
  const nickname = input.nickname.trim()
  if (!nickname) throw new Error("닉네임을 입력하세요.")
  if (nickname.length > 40) throw new Error("닉네임이 너무 깁니다.")

  const { data, error } = await supabase
    .from("drink_orders")
    .insert({
      nickname,
      item_id: input.drink.id,
      item_name: input.drink.name,
      amount: input.drink.price.amount,
      currency: input.drink.price.currency,
      created_by: input.createdBy,
    })
    .select(COLUMNS)
    .single()

  if (error) throw new Error(error.message)
  return toOrder(data as Row)
}

/**
 * One order, read without a session.
 *
 * Service client: the customer holding the phone has no account. A bad or
 * unknown id returns null rather than throwing, so the page can 404 instead
 * of erroring at someone who mistyped a URL.
 */
export async function getDrinkOrder(orderId: string): Promise<DrinkOrder | null> {
  if (!orderId) return null
  const { data, error } = await createServiceClient()
    .from("drink_orders")
    .select(COLUMNS)
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return null
  return toOrder(data as Row)
}

/**
 * One order, read under the caller's own session.
 *
 * The same row getDrinkOrder returns, fetched the other way round: this is an
 * admin looking at their own counter, so RLS is what permits it rather than
 * the service key. Kept separate so the elevated read stays confined to the
 * one page that genuinely has no session behind it.
 */
export async function getDrinkOrderAs(
  supabase: SupabaseClient,
  orderId: string,
): Promise<DrinkOrder | null> {
  if (!orderId) return null
  const { data, error } = await supabase
    .from("drink_orders")
    .select(COLUMNS)
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return null
  return toOrder(data as Row)
}

/**
 * Record that PayPal took the money.
 *
 * Conditional on the row still being pending, and that condition is the lock:
 * a QR left on screen can be scanned twice, and the update returning no row is
 * how the second attempt finds out it lost. Reported rather than thrown,
 * because losing that race is not an error — the money is already ours.
 */
export async function markDrinkOrderPaid(
  orderId: string,
  paypal: { orderId: string; captureId: string },
): Promise<{ claimed: boolean }> {
  const { data, error } = await createServiceClient()
    .from("drink_orders")
    .update({
      status: "paid",
      paypal_order_id: paypal.orderId,
      paypal_capture_id: paypal.captureId,
      paid_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle()

  if (error) throw new Error(error.message)
  return { claimed: Boolean(data) }
}

/**
 * Record a refund that PayPal has already accepted.
 *
 * Only ever called after the refund call succeeds. Writing this first and
 * refunding after would leave a row claiming money went back that never did,
 * which is the one direction of that mistake nobody catches.
 */
export async function markDrinkOrderRefunded(
  supabase: SupabaseClient,
  orderId: string,
  refundId: string,
): Promise<void> {
  const { error } = await supabase
    .from("drink_orders")
    .update({
      status: "refunded",
      paypal_refund_id: refundId,
      refunded_at: new Date().toISOString(),
    })
    .eq("id", orderId)
    .eq("status", "paid")

  if (error) throw new Error(error.message)
}

/**
 * The counter list: most recent first.
 *
 * Read under the admin's own session, so RLS is what permits it. Capped
 * because this is a working screen for the last few minutes of a shift, not a
 * sales report — a nickname search is what finds yesterday.
 */
export async function listDrinkOrders(
  supabase: SupabaseClient,
  options: { search?: string; limit?: number } = {},
): Promise<DrinkOrder[]> {
  const search = options.search?.trim()
  let query = supabase
    .from("drink_orders")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 30)

  // Case-insensitive contains: people type their own name back in whatever
  // case they feel like, and half-remembering it is the normal case.
  if (search) query = query.ilike("nickname", `%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Row[]).map(toOrder)
}
