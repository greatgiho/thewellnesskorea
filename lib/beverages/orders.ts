import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import { siteOrigin } from "@/lib/site-origin"
import { money, type Money } from "@/lib/payments/money"
import type { Payer } from "@/lib/payments/payer"
import { formatListPrice, type Beverage } from "@/lib/beverages/menu"

/**
 * Counter sales: writing them down, finding them again, and settling them.
 *
 * Two different clients on purpose, and which one is used says who is asking:
 *
 *   - the admin screens read and write through the caller's own session, so
 *     RLS is what decides they may. Nothing here elevates that.
 *   - the customer's page and the capture that follows it use the service
 *     client, because nobody buying a beverage is signed in. The order id in
 *     the URL is the credential, exactly as the ticket and cancel-by-token
 *     pages treat theirs.
 */

export type BeverageOrderStatus = "pending" | "paid" | "refunded"

export type BeverageOrder = {
  id: string
  /** What the customer said to call them. Optional — most never type one. */
  nickname: string | null
  /** Who PayPal says paid. Empty until the money arrives, and sometimes after. */
  payer: Payer
  itemId: string
  itemName: string
  price: Money
  status: BeverageOrderStatus
  paypalCaptureId: string | null
  paidAt: string | null
  refundedAt: string | null
  createdAt: string
}

const COLUMNS =
  "id, nickname, item_id, item_name, amount, currency, status, paypal_capture_id, payer_name, payer_email, payer_account_id, payer_card, paid_at, refunded_at, created_at"

type Row = {
  id: string
  nickname: string | null
  payer_name: string | null
  payer_email: string | null
  payer_account_id: string | null
  payer_card: string | null
  item_id: string
  item_name: string
  amount: number | string
  currency: string
  status: BeverageOrderStatus
  paypal_capture_id: string | null
  paid_at: string | null
  refunded_at: string | null
  created_at: string
}

function toOrder(row: Row): BeverageOrder {
  return {
    id: row.id,
    nickname: row.nickname,
    payer: {
      ...(row.payer_name ? { name: row.payer_name } : {}),
      ...(row.payer_email ? { email: row.payer_email } : {}),
      ...(row.payer_account_id ? { accountId: row.payer_account_id } : {}),
      ...(row.payer_card ? { card: row.payer_card } : {}),
    },
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
export function beverageOrderUrl(orderId: string): string {
  return new URL(`/beverages/${orderId}`, siteOrigin()).toString()
}

/**
 * Ring up one beverage.
 *
 * The price is copied off the menu here and never read from it again, so
 * editing lib/beverages/menu.ts cannot change what an order already on a screen
 * is asking for.
 *
 * The name is optional, and usually absent: PayPal returns one with the money,
 * and it is a better name than a typed one — it is the account holder's own.
 * A nickname is for the case PayPal cannot answer, which is a guest paying by
 * card, and for whenever a barista would rather type than wait.
 */
export async function createBeverageOrder(
  supabase: SupabaseClient,
  input: { nickname?: string; beverage: Beverage; createdBy: string },
): Promise<BeverageOrder> {
  const nickname = input.nickname?.trim() || null
  if (nickname && nickname.length > 40) throw new Error("닉네임이 너무 깁니다.")

  const { data, error } = await supabase
    .from("beverage_orders")
    .insert({
      nickname,
      item_id: input.beverage.id,
      // The sign price is the item's name. Snapshotted like the amount is, so
      // a receipt still says ₩5,000 after the menu has moved on.
      item_name: formatListPrice(input.beverage),
      amount: input.beverage.price.amount,
      currency: input.beverage.price.currency,
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
export async function getBeverageOrder(orderId: string): Promise<BeverageOrder | null> {
  if (!orderId) return null
  const { data, error } = await createServiceClient()
    .from("beverage_orders")
    .select(COLUMNS)
    .eq("id", orderId)
    .maybeSingle()

  if (error || !data) return null
  return toOrder(data as Row)
}

/**
 * One order, read under the caller's own session.
 *
 * The same row getBeverageOrder returns, fetched the other way round: this is
 * an admin looking at their own counter, so RLS is what permits it rather than
 * the service key. Kept separate so the elevated read stays confined to the
 * one page that genuinely has no session behind it.
 */
export async function getBeverageOrderAs(
  supabase: SupabaseClient,
  orderId: string,
): Promise<BeverageOrder | null> {
  if (!orderId) return null
  const { data, error } = await supabase
    .from("beverage_orders")
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
export async function markBeverageOrderPaid(
  orderId: string,
  paypal: { orderId: string; captureId: string; payer: Payer },
): Promise<{ claimed: boolean }> {
  const { data, error } = await createServiceClient()
    .from("beverage_orders")
    .update({
      status: "paid",
      paypal_order_id: paypal.orderId,
      paypal_capture_id: paypal.captureId,
      // Whatever PayPal was willing to say. Written as null rather than left
      // out, so a row that recorded nothing is distinguishable from one this
      // never ran against — and never as "", which would read as a name.
      payer_name: paypal.payer.name ?? null,
      payer_email: paypal.payer.email ?? null,
      payer_account_id: paypal.payer.accountId ?? null,
      payer_card: paypal.payer.card ?? null,
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
export async function markBeverageOrderRefunded(
  supabase: SupabaseClient,
  orderId: string,
  refundId: string,
): Promise<void> {
  const { error } = await supabase
    .from("beverage_orders")
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
 * The counter list: sales, most recent first.
 *
 * Pending orders are left out. Ringing one up is not a sale — it is a QR going
 * on a screen, and it becomes a row here when someone actually pays. Listing
 * them would fill the counter with beverages nobody bought: every mistyped
 * name, every customer who changed their mind, every QR never scanned.
 *
 * It also makes the list mean one thing. What is here is money taken, so it is
 * both the queue of beverages to make and the place a refund is found — and a
 * '대기' row is neither.
 *
 * Read under the admin's own session, so RLS is what permits it. Capped
 * because this is a working screen for the last few minutes of a shift, not a
 * sales report — a nickname search is what finds yesterday.
 */
export async function listBeverageOrders(
  supabase: SupabaseClient,
  options: { search?: string; limit?: number } = {},
): Promise<BeverageOrder[]> {
  const search = options.search?.trim()
  let query = supabase
    .from("beverage_orders")
    .select(COLUMNS)
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(options.limit ?? 30)

  // Case-insensitive contains: people type their own name back in whatever
  // case they feel like, and half-remembering it is the normal case.
  if (search) query = query.ilike("nickname", `%${search}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data as Row[]).map(toOrder)
}
