"use client"

import { useActionState } from "react"
import Link from "next/link"
import { submitGuestBooking, type GuestBookingState } from "@/app/book/actions"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { BookingSessionSummary } from "./booking-session-summary"

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"

const initialState: GuestBookingState = {}

type MemberPrefill = {
  name: string
  email: string
  phone?: string | null
}

type GuestBookingFormProps = {
  session: SessionWithRelations
  memberPrefill?: MemberPrefill | null
}

export function GuestBookingForm({
  session,
  memberPrefill,
}: GuestBookingFormProps) {
  const [state, formAction, pending] = useActionState(
    submitGuestBooking,
    initialState,
  )

  const isMember = Boolean(memberPrefill)

  return (
    <div className="space-y-8">
      <BookingSessionSummary session={session} />

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="sessionId" value={session.id} />

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Your details
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isMember
              ? "Booking as your signed-in account. We'll email your confirmation."
              : "No account needed. We'll email your confirmation and a link to cancel if plans change."}
          </p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Full name</span>
              <input
                name="guestName"
                type="text"
                required
                autoComplete="name"
                className={fieldClass}
                placeholder="Your name"
                defaultValue={memberPrefill?.name ?? ""}
                readOnly={isMember}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                name="guestEmail"
                type="email"
                required
                autoComplete="email"
                className={fieldClass}
                placeholder="you@example.com"
                defaultValue={memberPrefill?.email ?? ""}
                readOnly={isMember}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                Phone <span className="font-normal text-muted-foreground">(optional)</span>
              </span>
              <input
                name="guestPhone"
                type="tel"
                autoComplete="tel"
                className={fieldClass}
                placeholder="+82 10 0000 0000"
                defaultValue={memberPrefill?.phone ?? ""}
              />
            </label>
          </div>

          {state.error ? (
            <p className="mt-4 text-sm text-destructive">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Reserving…" : "Confirm reservation"}
          </button>

          {!isMember ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Have an account?{" "}
              <Link
                href="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              {" "}to book faster.
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            By reserving, you agree to our on-site payment terms. Online payment
            is not required at this time.
          </p>
        </div>
      </form>
    </div>
  )
}
