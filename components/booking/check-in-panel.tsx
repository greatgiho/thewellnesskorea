"use client"

import { useState, useTransition } from "react"
import { CheckCircle2, AlertTriangle, RotateCcw } from "lucide-react"
import { checkInByToken, undoCheckIn } from "@/app/checkin/[token]/actions"
import { TicketDetails } from "@/components/booking/ticket-details"
import { PartyAdmits } from "@/components/booking/party-admits"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { TicketSummary } from "@/lib/bookings/checkin"

function timeOf(iso: string): string {
  return formatBookingDateTime(iso, iso).timeRange
}

/**
 * The door screen.
 *
 * Check-in is a button rather than something that happens on page load. The
 * page is opened by following a scanned link, and a GET that admits someone is
 * a GET that a link preview or a prefetch can fire; more practically, whoever
 * is holding the phone should read the name and the class before admitting
 * anyone, and a button is where they stop to do that.
 */
export function CheckInPanel({
  token,
  ticket,
}: {
  token: string
  ticket: TicketSummary
}) {
  const [pending, startTransition] = useTransition()
  const [checkedInAt, setCheckedInAt] = useState<string | null>(
    ticket.checkedInAt,
  )
  const [duplicate, setDuplicate] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const notConfirmed = ticket.status !== "confirmed"

  const runCheckIn = () => {
    setError(null)
    startTransition(async () => {
      const result = await checkInByToken(token)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setCheckedInAt(result.checkedInAt)
      setDuplicate(result.alreadyCheckedIn)
    })
  }

  const runUndo = () => {
    setError(null)
    startTransition(async () => {
      const result = await undoCheckIn(token)
      if (!result.ok) {
        setError(result.error)
        return
      }
      setCheckedInAt(null)
      setDuplicate(false)
    })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <TicketDetails ticket={ticket} />
      </div>

      {notConfirmed ? (
        <p className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          This booking is {ticket.status.replace("_", " ")}.
        </p>
      ) : checkedInAt ? (
        <div className="space-y-4">
          {/* The duplicate case is the one worth interrupting for: the same
              ticket held up twice usually means two people trying to enter on
              one booking. */}
          <p
            className={`flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-foreground ${
              duplicate
                ? "border border-[oklch(0.55_0.12_55)]/40 bg-[oklch(0.55_0.12_55)]/10"
                : "border border-primary/30 bg-primary/10"
            }`}
          >
            {duplicate ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            )}
            <span>
              {duplicate
                ? `Already checked in at ${timeOf(checkedInAt)}.`
                : `Checked in at ${timeOf(checkedInAt)}.`}
            </span>
          </p>
          <button
            type="button"
            onClick={runUndo}
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            {pending ? "Undoing…" : "Undo check-in"}
          </button>
        </div>
      ) : (
        <>
          {/* Repeated here, next to the button, when it is more than one
              person. The details above are read while comparing faces; this is
              read in the instant before admitting them. */}
          {ticket.partySize > 1 ? (
            <p className="flex items-center justify-between gap-4 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4">
              <span className="text-sm text-muted-foreground">Admitting</span>
              <PartyAdmits
                adults={ticket.adultCount}
                children={ticket.childCount}
              />
            </p>
          ) : null}
          <button
            type="button"
            onClick={runCheckIn}
            disabled={pending}
            className="w-full rounded-full bg-primary px-6 py-4 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {pending
              ? "Checking in…"
              : ticket.partySize > 1
                ? `Check in ${ticket.partySize} people`
                : "Check in"}
          </button>
        </>
      )}

      {error ? (
        <p className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          {error}
        </p>
      ) : null}
    </div>
  )
}
