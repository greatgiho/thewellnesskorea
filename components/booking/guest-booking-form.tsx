"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { submitGuestBooking, type GuestBookingState } from "@/app/book/actions"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { FIELD_PUBLIC } from "@/lib/ui/field"
import {
  discountFrom,
  formatMoney,
  paymentMode,
  quoteParty,
  MAX_PARTY_SIZE,
  type Party,
} from "@/lib/payments/money"
import { formatParty } from "@/lib/bookings/format"
import { PriceTag } from "@/components/booking/price-tag"
import { PartyPicker } from "@/components/booking/party-picker"
import { CouponField } from "@/components/booking/coupon-field"
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
  const [email, setEmail] = useState(memberPrefill?.email ?? "")
  const [party, setParty] = useState<Party>({ adults: 1, children: 0 })
  const [state, formAction, pending] = useActionState(
    submitGuestBooking,
    initialState,
  )

  const isMember = Boolean(memberPrefill)
  // Null child price = this class has no child rate, so no child row appears.
  const quote = quoteParty(
    session.price_currency,
    session.price_amount,
    session.child_price_amount,
    discountFrom(session.discount_type, session.discount_value),
    party,
  )
  // The discounted total is what gets charged, so it drives the flow too — a
  // 100% discount makes this a free booking with no payment step.
  const mode = paymentMode(quote.total)
  // Never offer more seats than exist. The booking transaction checks this
  // again under a lock, so a class that fills up meanwhile is caught there.
  const spotsLeft = Math.max(0, session.capacity - session.booked_count)
  const maxSize = Math.min(MAX_PARTY_SIZE, spotsLeft)
  const isParty = quote.size > 1
  // A lone child booking should show the child's price, not the adult's.
  const soloPriced =
    party.adults === 0 && quote.child ? quote.child : quote.adult

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

          <PartyPicker
            quote={quote}
            party={party}
            onChange={setParty}
            maxSize={maxSize}
            disabled={pending}
          />

          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {mode === "free" ? (
              <>
                <span className="font-medium">Free class</span> — no payment
                required.{" "}
                {isParty ? `Reserving ${quote.size} spots.` : "Reserve your spot below."}
              </>
            ) : (
              <>
                {/* A party is quoted as one total; a single booking keeps the
                    struck-through list price, which a sum of one would hide. */}
                {isParty ? (
                  <>
                    {formatParty(party.adults, party.children)} — total{" "}
                    <span className="font-medium">{formatMoney(quote.total)}</span>
                  </>
                ) : (
                  <>
                    Class fee:{" "}
                    <PriceTag priced={soloPriced} className="font-medium" />
                  </>
                )}
                {mode === "online"
                  ? " — you'll complete online payment on the next step."
                  : " — pay on-site at the studio when you arrive."}
              </>
            )}
          </p>

          <CouponField
            sessionId={session.id}
            email={email}
            party={party}
            disabled={pending}
          />

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
