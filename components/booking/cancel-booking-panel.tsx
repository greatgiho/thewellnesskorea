"use client"

import { useActionState } from "react"
import { confirmCancelBooking, type CancelBookingState } from "@/app/book/actions"
import type { BookingSummary } from "@/lib/bookings/queries"
import { BookingSessionSummary } from "./booking-session-summary"

const initialState: CancelBookingState = {}

type CancelBookingPanelProps = {
  cancelToken: string
  summary: BookingSummary
}

export function CancelBookingPanel({
  cancelToken,
  summary,
}: CancelBookingPanelProps) {
  const [state, formAction, pending] = useActionState(
    confirmCancelBooking,
    initialState,
  )

  if (summary.status === "cancelled") {
    return (
      <div className="space-y-6">
        <BookingSessionSummary summary={summary} />
        <div className="rounded-3xl border border-border bg-secondary/30 px-6 py-8 text-center">
          <p className="font-serif text-xl text-foreground">
            This reservation is already cancelled.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <BookingSessionSummary summary={summary} />

      <form action={formAction} className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <input type="hidden" name="cancelToken" value={cancelToken} />
        <p className="text-sm text-muted-foreground">
          Cancelling will release your spot for someone else. This cannot be undone
          from this page—you can book again if space is still available.
        </p>

        {state.error ? (
          <p className="mt-4 text-sm text-destructive">{state.error}</p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60 sm:w-auto"
        >
          {pending ? "Cancelling…" : "Cancel reservation"}
        </button>
      </form>
    </div>
  )
}
