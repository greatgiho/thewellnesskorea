import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { DrinkRingUpForm } from "@/components/admin/drink-ring-up-form"
import { DrinkOrderPanel } from "@/components/admin/drink-order-panel"
import { DrinkOrdersList } from "@/components/admin/drink-orders-list"
import { DEFAULT_DRINK_ID, findDrink } from "@/lib/drinks/menu"
import { getDrinkOrderAs, listDrinkOrders } from "@/lib/drinks/orders"
import { formatMoney } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "음료 — Admin",
}

// The list changes when a customer pays, which happens on their phone rather
// than here. Cached, the counter would show a paid drink as still waiting.
export const dynamic = "force-dynamic"

type Props = { searchParams: Promise<{ order?: string; q?: string }> }

export default async function AdminDrinksPage({ searchParams }: Props) {
  const { supabase } = await requireAdminSession()
  const { order: orderId, q } = await searchParams

  const drink = findDrink(DEFAULT_DRINK_ID)
  const [current, orders] = await Promise.all([
    orderId ? getDrinkOrderAs(supabase, orderId) : null,
    listDrinkOrders(supabase, { search: q }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">음료</h1>
      </div>

      {drink ? (
        <DrinkRingUpForm price={formatMoney(drink.price)} />
      ) : (
        <p className="text-sm text-destructive">판매 중인 품목이 없습니다.</p>
      )}

      {current ? <DrinkOrderPanel order={current} /> : null}

      <DrinkOrdersList orders={orders} initialSearch={q ?? ""} />
    </div>
  )
}
