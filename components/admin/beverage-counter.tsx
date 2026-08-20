"use client"

import { useActionState, useEffect, useRef, useState, useTransition } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { FIELD } from "@/lib/ui/field"
import { BeverageOrderCard } from "@/components/admin/beverage-order-card"
import { BeverageOrdersList } from "@/components/admin/beverage-orders-list"
import type { CounterOrder } from "@/lib/beverages/counter"
import type { BeverageOrder } from "@/lib/beverages/orders"
import {
  beverageOrderStatus,
  loadCounterOrder,
  ringUpBeverage,
  type RingUpState,
} from "@/app/a/(dashboard)/beverages/actions"

/**
 * The counter: ring one up, watch for it to be paid, look one up to refund.
 *
 * One piece of state says what the card is showing, and three things write it:
 * ringing up, clicking a name in the list, and the poll noticing a payment.
 * Nothing reads it back from anywhere else.
 *
 * It was briefly split between this state and ?order= in the address, with a
 * rule for which one counted. That rule was the bug in #239: the address does
 * not clear itself, so once a click in the list had put an order there, every
 * ring-up after it was ignored and the counter showed the same QR for good. A
 * screen with two sources of truth needs a tie-break, and a tie-break is a
 * thing that can be wrong. So there is one source, and no address to keep in
 * step with it.
 *
 * The cost is that a reload does not bring a pending QR back. Ring it up
 * again — the abandoned row is not a sale, so it is not in the list and not in
 * anyone's way.
 */
/** One item as the counter needs it: an id to send, and two prices to read. */
export type MenuButton = {
  id: string
  /** What the sign says, and what the barista picks by. */
  listPrice: string
  /** What the customer is actually charged, since PayPal cannot take won. */
  charged: string
}

export function BeverageCounter({
  menu,
  orders,
  initialSearch,
}: {
  menu: MenuButton[]
  orders: BeverageOrder[]
  initialSearch: string
}) {
  const router = useRouter()
  const [state, action] = useActionState<RingUpState, FormData>(ringUpBeverage, {})
  const [order, setOrder] = useState<CounterOrder | null>(null)
  const [selecting, startSelecting] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (state.order) setOrder(state.order)
  }, [state.order])

  // Poll while there is something to wait for, and stop the moment there is
  // not. Unmounting the interval is what stops it, so a paid counter at rest
  // makes no requests at all. The refresh is for the list, which gains a row
  // exactly when this answer changes.
  useEffect(() => {
    if (!order || order.status !== "pending") return
    const id = order.id
    const timer = setInterval(async () => {
      const status = await beverageOrderStatus(id)
      if (!status || status === "pending") return
      setOrder((prev) => (prev && prev.id === id ? { ...prev, status } : prev))
      router.refresh()
    }, 3000)
    return () => clearInterval(timer)
  }, [order, router])

  const select = (id: string) => {
    startSelecting(async () => {
      const picked = await loadCounterOrder(id)
      if (picked) setOrder(picked)
    })
  }

  return (
    <div className="space-y-6">
      <form
        action={action}
        className="space-y-3"
        // Cleared on submit rather than after: the name is already in the
        // FormData, and a barista with a queue is typing the next one before
        // this one is on screen.
        onSubmit={() => {
          requestAnimationFrame(() => {
            if (input.current) input.current.value = ""
          })
        }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={input}
            name="nickname"
            required
            maxLength={40}
            autoComplete="off"
            autoFocus
            placeholder="닉네임"
            className={`${FIELD} max-w-[220px] flex-1`}
          />
          {menu.map((item) => (
            <RingUpButton key={item.id} item={item} />
          ))}
        </div>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
      </form>

      {order ? <BeverageOrderCard order={order} /> : null}

      <BeverageOrdersList
        orders={orders}
        initialSearch={initialSearch}
        selectedId={order?.id ?? null}
        busy={selecting}
        onSelect={select}
      />
    </div>
  )
}

/**
 * One price, one button.
 *
 * A submit button carries its own name and value, so which item was rung up is
 * whichever button was pressed — no separate selector to get out of step with
 * the press, and nothing to reset between customers.
 *
 * The won is the large half because that is the price on the sign and the one
 * a barista is told out loud. The dollars are underneath because that is what
 * the customer's card is charged, and the two being different is a fact about
 * PayPal that the person taking the order should not have to remember.
 */
function RingUpButton({ item }: { item: MenuButton }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      name="itemId"
      value={item.id}
      disabled={pending}
      className="rounded-full bg-primary px-5 py-1.5 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      <span className="block text-sm font-medium">{item.listPrice}</span>
      <span className="block text-[11px] opacity-80">{item.charged}</span>
    </button>
  )
}
