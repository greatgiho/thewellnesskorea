import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { BeverageCounter } from "@/components/admin/beverage-counter"
import { DEFAULT_BEVERAGE_ID, findBeverage } from "@/lib/beverages/menu"
import { listBeverageOrders } from "@/lib/beverages/orders"
import { formatMoney } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "음료 — Admin",
}

// The list changes when a customer pays, which happens on their phone rather
// than here. Cached, the counter would show a paid beverage as still waiting.
export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ q?: string }> }

/**
 * The counter screen.
 *
 * The address carries the search and nothing else. Which order the card is
 * showing lives in the counter itself — putting it here as well is what let a
 * stale ?order= outrank a fresh ring-up (#239).
 */
export default async function AdminBeveragesPage({ searchParams }: Props) {
  const { supabase } = await requireAdminSession()
  const { q } = await searchParams

  const beverage = findBeverage(DEFAULT_BEVERAGE_ID)
  const orders = await listBeverageOrders(supabase, { search: q })

  if (!beverage) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-3xl text-foreground">음료</h1>
        <p className="text-sm text-destructive">판매 중인 품목이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-foreground">음료</h1>
      <BeverageCounter
        price={formatMoney(beverage.price)}
        orders={orders}
        initialSearch={q ?? ""}
      />
    </div>
  )
}
