"use client"

import { useActionState } from "react"
import Link from "next/link"
import { submitGuestBooking, type GuestBookingState } from "@/app/book/actions"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { FIELD_PUBLIC } from "@/lib/ui/field"
import { money, formatMoney, paymentMode } from "@/lib/payments/money"
import { BookingSessionSummary } from "./booking-session-summary"

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
  const price = money(session.price_currency, session.price_amount)
  const mode = paymentMode(price)

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
                className={FIELD_PUBLIC}
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
                className={FIELD_PUBLIC}
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
                className={FIELD_PUBLIC}
                placeholder="+82 10 0000 0000"
                defaultValue={memberPrefill?.phone ?? ""}
              />
            </label>
          </div>

          {mode === "online" ? (
            <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              Class fee:{" "}
              <span className="font-medium">{formatMoney(price)}</span>
              {" "}— you&apos;ll complete online payment on the next step.
            </p>
          ) : mode === "onsite" ? (
            <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              Class fee:{" "}
              <span className="font-medium">{formatMoney(price)}</span>
              {" "}— pay on-site at the studio when you arrive.
            </p>
          ) : (
            <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              <span className="font-medium">Free class</span> — no payment
              required. Reserve your spot below.
            </p>
          )}

          {state.error ? (
            <p className="mt-4 text-sm text-destructive">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
          >
            {pending
              ? "Continuing…"
              : mode === "online"
                ? "Continue to payment"
                : "Confirm reservation"}
          </button>

          {!isMember ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Have an account?{" "}
              <Link
                href="/u/signin"
                className="text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
              {" "}to book faster.
            </p>
          ) : null}

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            {mode === "online"
              ? "By continuing, you agree to our online payment and cancellation terms."
              : mode === "onsite"
                ? "By reserving, you agree to our on-site payment and cancellation terms."
                : "By reserving, you agree to our cancellation terms."}
          </p>
        </div>
      </form>
    </div>
  )
}
