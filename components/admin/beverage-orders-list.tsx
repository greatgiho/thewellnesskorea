"use client"

import { useActionState, useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { FIELD } from "@/lib/ui/field"
import { BeverageOrderStatusBadge } from "@/components/admin/beverage-order-status"
import {
  refundBeverageOrder,
  type RefundState,
} from "@/app/a/(dashboard)/beverages/actions"
import { formatMoney } from "@/lib/payments/money"
import { formatKstDateTime } from "@/lib/time/kst"
import { beverageOrderLabels } from "@/lib/beverages/labels"
import type { BeverageOrder } from "@/lib/beverages/orders"

/**
 * The day's counter sales, and the way back to one of them.
 *
 * Sales only: an order that was rung up and never paid for is not on here.
 * What is on here is the queue of beverages to make and the place a refund is
 * found, and both of those are about money that moved.
 *
 * Searched by nickname because that is the only thing a customer asking for a
 * refund can tell us. They will not have an order number and they will not
 * know the time — they know the name they gave, and roughly when.
 *
 * Picking a row asks the counter above to show it, rather than linking to an
 * address that names it. The address version is what made a ring-up stop
 * changing the card (#239) — two things saying what the card was about, and a
 * rule deciding between them. Only the search is in the address now, and the
 * search does not say what the card shows.
 */
export function BeverageOrdersList({
  orders,
  initialSearch,
  selectedId,
  busy,
  onSelect,
}: {
  orders: BeverageOrder[]
  initialSearch: string
  selectedId: string | null
  busy: boolean
  onSelect: (id: string) => void
}) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch)
  // Whatever named them — their nickname, PayPal's name, or the receipt code
  // — with a clock added only where two come out the same.
  const labels = beverageOrderLabels(
    orders.map((o) => ({
      id: o.id,
      nickname: o.nickname,
      payer: o.payer,
      paypalCaptureId: o.paypalCaptureId,
      createdAt: o.createdAt,
    })),
  )

  const submit = () => {
    const q = search.trim()
    router.push(q ? `/a/beverages?q=${encodeURIComponent(q)}` : "/a/beverages")
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
          placeholder="이름 · 이메일 · 영수증 코드"
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
                  <button
                    type="button"
                    onClick={() => onSelect(order.id)}
                    disabled={busy}
                    aria-current={order.id === selectedId ? "true" : undefined}
                    className="truncate font-medium text-foreground hover:underline disabled:opacity-60 aria-[current]:underline"
                  >
                    {labels[order.id]}
                  </button>
                  <BeverageOrderStatusBadge status={order.status} />
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.itemName} · {formatMoney(order.price)} ·{" "}
                  {formatKstDateTime(order.createdAt)}
                </p>
                {/* What a refund is checked against before the money goes
                    back. The account id is not here on purpose: it identifies
                    a returning customer to us, and reads as noise to the
                    person holding the phone. */}
                {order.payer.email ?? order.payer.card ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                    {order.payer.email ?? order.payer.card}
                  </p>
                ) : null}
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

function RefundButton({ order, label }: { order: BeverageOrder; label: string }) {
  const [state, action, pending] = useActionState<RefundState, FormData>(
    refundBeverageOrder,
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
