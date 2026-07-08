"use client"

import { useActionState } from "react"
import { cancelMemberBooking, type MemberCancelState } from "@/app/account/actions"
import { formatBookingDateTime, formatMoney } from "@/lib/bookings/format"
import type { MemberBookingItem } from "@/lib/bookings/member-queries"

const initialState: MemberCancelState = {}

type MemberBookingsListProps = {
  bookings: MemberBookingItem[]
}

export function MemberBookingsList({ bookings }: MemberBookingsListProps) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-serif text-2xl text-foreground">No reservations yet.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Book a class from the schedule and it will appear here.
        </p>
        <a
          href="/#schedule"
          className="mt-6 inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse classes
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {bookings.map((booking) => (
        <MemberBookingCard key={booking.id} booking={booking} />
      ))}
    </div>
  )
}

function MemberBookingCard({ booking }: { booking: MemberBookingItem }) {
  const [state, formAction, pending] = useActionState(
    cancelMemberBooking,
    initialState,
  )
  const { heading, timeRange } = formatBookingDateTime(
    booking.sessionStartsAt,
    booking.sessionEndsAt,
  )
  const isConfirmed = booking.status === "confirmed"

  return (
    <article className="rounded-3xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {isConfirmed ? "Confirmed" : booking.status}
          </p>
          <h2 className="mt-2 font-serif text-xl text-foreground">
            {booking.sessionTitle}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{heading}</p>
          <p className="text-sm text-muted-foreground">{timeRange}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {booking.floorName} · with {booking.instructorName}
          </p>
        </div>
      </div>

      {booking.payment ? (
        <div className="mt-5 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {booking.payment.status === "paid" ? "결제 완료" : "결제 상태"}
            </span>
            <span className="font-medium text-foreground">
              {formatMoney(booking.payment.amount, booking.payment.currency)}
              {booking.payment.status === "paid" ? "" : ` · ${booking.payment.status}`}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {booking.payment.provider.toUpperCase()} · 주문번호{" "}
            <span className="font-mono">{booking.payment.merchantUid}</span>
          </p>
          {booking.payment.pgTid ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              거래번호 <span className="font-mono">{booking.payment.pgTid}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      {isConfirmed ? (
        <form action={formAction} className="mt-6">
          <input type="hidden" name="bookingId" value={booking.id} />
          {state.error ? (
            <p className="mb-3 text-sm text-destructive">{state.error}</p>
          ) : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {pending ? "Cancelling…" : "Cancel reservation"}
          </button>
        </form>
      ) : null}
    </article>
  )
}
