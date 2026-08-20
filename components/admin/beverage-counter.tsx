"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter } from "next/navigation"
import { FIELD } from "@/lib/ui/field"
import {
  BeverageOrderCard,
  type CounterOrder,
} from "@/components/admin/beverage-order-card"
import {
  beverageOrderStatus,
  ringUpBeverage,
  type RingUpState,
} from "@/app/a/(dashboard)/beverages/actions"

/**
 * The counter: ring one up, watch for it to be paid.
 *
 * Ringing up is one round trip. It used to be two — the action, then a
 * redirect that re-rendered the whole page to display a QR the action already
 * had in hand. On production that second render is two auth calls and two
 * queries, which is most of the wait for something that costs 3ms to draw.
 *
 * Waiting is one row read rather than a page refresh, and the page is only
 * refreshed when the answer actually changes.
 */
export function BeverageCounter({
  price,
  initialOrder,
}: {
  price: string
  initialOrder: CounterOrder | null
}) {
  const router = useRouter()
  const [state, action] = useActionState<RingUpState, FormData>(ringUpBeverage, {})
  const [order, setOrder] = useState<CounterOrder | null>(initialOrder)
  const input = useRef<HTMLInputElement>(null)

  // Which order the card is about: whichever source spoke last.
  //
  // Two can name one — a ring-up here, and ?order= in the address, which is
  // how a reload, a second screen or a click in the list arrives at one.
  //
  // Deciding by reading the address was wrong, and wrong in a way that got
  // worse the longer the screen was open: ?order= does not clear itself, so
  // once a click in the list had put one there, every ring-up after it was
  // ignored and the counter showed the same QR forever. Which source is
  // *newer* is the actual question, and the address cannot answer it.
  const seenFromAddress = useRef(initialOrder?.id ?? null)

  useEffect(() => {
    // Only when the address moved to a different order. A re-render for any
    // other reason — the poll's refresh, the list updating — hands back the
    // same one, and adopting it would undo a ring-up that happened since.
    const id = initialOrder?.id ?? null
    if (id === seenFromAddress.current) return
    seenFromAddress.current = id
    setOrder(initialOrder)
  }, [initialOrder])

  useEffect(() => {
    if (!state.order) return
    setOrder(state.order)
    // Put the new one in the address as well, so a reload or a second screen
    // finds the QR that is on this one. replaceState rather than a navigation:
    // this is the same page showing the same thing, and a router round trip
    // here is the render this screen was rebuilt to avoid. Nothing reads the
    // address to decide what to show any more, so it cannot fight anything.
    seenFromAddress.current = state.order.id
    window.history.replaceState(null, "", `/a/beverages?order=${state.order.id}`)
  }, [state.order])

  // Poll while there is something to wait for, and stop the moment there is
  // not. Unmounting the interval is what stops it, so a paid counter at rest
  // makes no requests at all.
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
          <RingUpButton price={price} />
        </div>
        {state.error ? (
          <p className="text-sm text-destructive">{state.error}</p>
        ) : null}
      </form>

      {order ? <BeverageOrderCard order={order} /> : null}
    </div>
  )
}

function RingUpButton({ price }: { price: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? "…" : `${price} QR 만들기`}
    </button>
  )
}
