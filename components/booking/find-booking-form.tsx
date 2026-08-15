"use client"

import { useActionState } from "react"
import { requestBookingLinks } from "@/app/book/find/actions"
import type { ActionResult } from "@/lib/errors"

/**
 * The same message whatever happened.
 *
 * Not vagueness for its own sake: a different answer for "we sent it" and "no
 * bookings here" turns this box into a way to find out whether a given person
 * has been to the studio. The wording is written to be true in both cases.
 */
export function FindBookingForm() {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(requestBookingLinks, null)

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <p className="text-sm text-foreground">
          Sent. If that address has an upcoming reservation, the ticket and
          cancellation links are on their way.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Nothing after a few minutes? Check the spam folder, or write to us and
          we&apos;ll look it up.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <label className="block">
        <span className="text-sm text-foreground">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"
        />
        <span className="mt-1.5 block text-xs text-muted-foreground">
          The address you booked with.
        </span>
      </label>

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Email me my links"}
      </button>
    </form>
  )
}
