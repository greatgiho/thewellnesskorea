"use client"

import { useActionState, useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { FIELD } from "@/lib/ui/field"
import { ringUpDrink, type RingUpState } from "@/app/a/(dashboard)/drinks/actions"

/**
 * Ring up a drink under a name.
 *
 * One field, and it keeps focus after every sale — this is used standing at a
 * counter with a queue, where reaching for the mouse between customers is the
 * whole cost of the screen.
 */
export function DrinkRingUpForm({ price }: { price: string }) {
  const [state, action] = useActionState<RingUpState, FormData>(ringUpDrink, {})
  const input = useRef<HTMLInputElement>(null)

  // Ringing up redirects to the new order, which remounts this. Focus it so
  // the next name can just be typed.
  useEffect(() => {
    input.current?.focus()
  }, [])

  return (
    <form action={action} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          name="nickname"
          required
          maxLength={40}
          autoComplete="off"
          placeholder="닉네임"
          className={`${FIELD} max-w-[220px] flex-1`}
        />
        <RingUpButton price={price} />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
    </form>
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
