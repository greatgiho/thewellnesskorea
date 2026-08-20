import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { BeverageCounter } from "@/components/admin/beverage-counter"
import { BeverageOrdersList } from "@/components/admin/beverage-orders-list"
import type { CounterOrder } from "@/components/admin/beverage-order-card"
import { DEFAULT_BEVERAGE_ID, findBeverage } from "@/lib/beverages/menu"
import { beverageOrderUrl, getBeverageOrderAs, listBeverageOrders } from "@/lib/beverages/orders"
import { referralQrSvg } from "@/lib/referrals/queries"
import { formatMoney } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "음료 — Admin",
}

// The list changes when a customer pays, which happens on their phone rather
// than here. Cached, the counter would show a paid beverage as still waiting.
export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ order?: string; q?: string }> }

/**
 * The counter screen.
 *
 * ?order= is here for arriving at one — a reload, a second screen, a click in
 * the list below. The common path does not come through here at all: ringing
 * up returns its own order and QR, so nothing navigates.
 */
export default async function AdminBeveragesPage({ searchParams }: Props) {
  const { supabase } = await requireAdminSession()
  const { order: orderId, q } = await searchParams

  const beverage = findBeverage(DEFAULT_BEVERAGE_ID)
  const [current, orders] = await Promise.all([
    orderId ? getBeverageOrderAs(supabase, orderId) : null,
    listBeverageOrders(supabase, { search: q }),
  ])

  let initialOrder: CounterOrder | null = null
  if (current) {
    const url = beverageOrderUrl(current.id)
    initialOrder = {
      id: current.id,
      nickname: current.nickname,
      itemName: current.itemName,
      price: formatMoney(current.price),
      status: current.status,
      createdAt: current.createdAt,
      url,
      // Only what is still scannable. A paid or refunded order has no QR left
      // to show, and drawing one would cost a render for nothing.
      qrSvg: current.status === "pending" ? await referralQrSvg(url) : null,
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">음료</h1>

      {beverage ? (
        <BeverageCounter
          price={formatMoney(beverage.price)}
          initialOrder={initialOrder}
        />
      ) : (
        <p className="text-sm text-destructive">판매 중인 품목이 없습니다.</p>
      )}

      <BeverageOrdersList orders={orders} initialSearch={q ?? ""} />
    </div>
  )
}
