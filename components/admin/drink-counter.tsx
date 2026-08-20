"use client"

import { useActionState, useEffect, useRef, useState } from "react"
import { useFormStatus } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import { FIELD } from "@/lib/ui/field"
import {
  DrinkOrderCard,
  type CounterOrder,
} from "@/components/admin/drink-order-card"
import {
  drinkOrderStatus,
  ringUpDrink,
  type RingUpState,
} from "@/app/a/(dashboard)/drinks/actions"

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
export function DrinkCounter({
  price,
  initialOrder,
}: {
  price: string
  initialOrder: CounterOrder | null
}) {
  const router = useRouter()
  const [state, action] = useActionState<RingUpState, FormData>(ringUpDrink, {})
  const [rungUp, setRungUp] = useState<CounterOrder | null>(null)
  const input = useRef<HTMLInputElement>(null)

  // Which order the card is about.
  //
  // Two things can name one: the last ring-up, held here so it appears without
  // a navigation, and ?order= in the address, which is how a reload, a second
  // screen or a click in the list below arrives at one. The address wins when
  // it names something else — otherwise clicking a name in the list would
  // leave the card showing the drink before it.
  const wanted = useSearchParams().get("order")
  const order =
    rungUp && (!wanted || wanted === rungUp.id) ? rungUp : initialOrder

  // Nothing else needs telling. The list below is sales, and ringing one up is
  // not a sale yet — it joins the list when it is paid for, which is what the
  // poll below is waiting to find out.
  useEffect(() => {
    if (state.order) setRungUp(state.order)
  }, [state.order])

  // Poll while there is something to wait for, and stop the moment there is
  // not. Unmounting the interval is what stops it, so a paid counter at rest
  // makes no requests at all.
  useEffect(() => {
    if (!order || order.status !== "pending") return
    const id = order.id
    const timer = setInterval(async () => {
      const status = await drinkOrderStatus(id)
      if (!status || status === "pending") return
      setRungUp((prev) => (prev && prev.id === id ? { ...prev, status } : prev))
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

      {order ? <DrinkOrderCard order={order} /> : null}
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
