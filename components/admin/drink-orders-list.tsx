"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { FIELD } from "@/lib/ui/field"
import { DrinkOrderStatusBadge } from "@/components/admin/drink-order-status"
import {
  refundDrinkOrder,
  type RefundState,
} from "@/app/a/(dashboard)/drinks/actions"
import { formatMoney } from "@/lib/payments/money"
import { formatKstDateTime } from "@/lib/time/kst"
import { drinkOrderLabels } from "@/lib/drinks/labels"
import type { DrinkOrder } from "@/lib/drinks/orders"

/**
 * The day's counter sales, and the way back to one of them.
 *
 * Sales only: an order that was rung up and never paid for is not on here.
 * What is on here is the queue of drinks to make and the place a refund is
 * found, and both of those are about money that moved.
 *
 * Searched by nickname because that is the only thing a customer asking for a
 * refund can tell us. They will not have an order number and they will not
 * know the time — they know the name they gave, and roughly when.
 */
export function DrinkOrdersList({
  orders,
  initialSearch,
}: {
  orders: DrinkOrder[]
  initialSearch: string
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  // Two 태연s on one screen are two people. The clock goes on only the names
  // that clash, so the rest stay readable.
  const labels = drinkOrderLabels(
    orders.map((o) => ({ id: o.id, nickname: o.nickname, createdAt: o.createdAt })),
  )

  const submit = () => {
    const q = search.trim()
    router.push(q ? `/a/drinks?q=${encodeURIComponent(q)}` : "/a/drinks")
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-[280px]">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit()
          }}
          onBlur={submit}
          placeholder="닉네임으로 찾기"
          className={`${FIELD} pl-9`}
        />
      </div>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          {initialSearch ? "찾는 주문이 없습니다." : "아직 결제된 주문이 없습니다."}
        </p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/a/drinks?order=${order.id}`}
                    className="truncate font-medium text-foreground hover:underline"
                  >
                    {labels[order.id]}
                  </Link>
                  <DrinkOrderStatusBadge status={order.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.itemName} · {formatMoney(order.price)} ·{" "}
                  {formatKstDateTime(order.createdAt)}
                </p>
              </div>
              {order.status === "paid" ? (
                <RefundButton order={order} label={labels[order.id]} />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function RefundButton({ order, label }: { order: DrinkOrder; label: string }) {
  const [state, action, pending] = useActionState<RefundState, FormData>(
    refundDrinkOrder,
    {},
  )

  return (
    <form
      action={action}
      onSubmit={(e) => {
        // Money leaving is not undoable from here, and the row it is about is
        // one of several on screen with similar names on them.
        // The label rather than the bare nickname: this is the one moment the
        // difference between two 태연s costs money.
        if (
          !confirm(`${label} 님의 ${formatMoney(order.price)} 결제를 환불할까요?`)
        ) {
          e.preventDefault()
        }
      }}
    >
      <input type="hidden" name="orderId" value={order.id} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"
      >
        {pending ? "…" : "환불"}
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  )
}
