"use client"

import { useActionState, useState } from "react"
import Link from "next/link"
import { submitGuestBooking, type GuestBookingState } from "@/app/book/actions"
import { refundSummary, WITHDRAWAL_NOTICE } from "@/lib/legal/refund"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { FIELD_PUBLIC } from "@/lib/ui/field"
import {
  discountFrom,
  formatMoney,
  orderLines,
  paymentMode,
  quoteOrder,
  MAX_PARTY_SIZE,
  type OrderLine,
} from "@/lib/payments/money"
import { ratesForSession } from "@/lib/schedule/tiers"
import { formatParty } from "@/lib/bookings/format"
import { PriceTag } from "@/components/booking/price-tag"
import { OrderPicker } from "@/components/booking/order-picker"
import { CouponField } from "@/components/booking/coupon-field"
import { BankTransferDetails } from "@/components/booking/bank-transfer-details"
import type { BankInfo } from "@/lib/site/settings"
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
  /** From `?coupon=CODE` — see lib/coupons/link. Advisory; the booking
      transaction validates it again regardless. */
  initialCoupon?: string | null
  /**
   * Where a transfer should go, or null when we do not take them.
   *
   * Passed down rather than read here: this is a client component and cannot
   * await site_settings. Null keeps the block off the page entirely, which is
   * the only safe failure for an account number.
   */
  bank?: BankInfo | null
}

export function GuestBookingForm({
  session,
  memberPrefill,
  initialCoupon,
  bank,
}: GuestBookingFormProps) {
  const [email, setEmail] = useState(memberPrefill?.email ?? "")
  const [name, setName] = useState(memberPrefill?.name ?? "")
  const rates = ratesForSession(session)
  // Opens on one adult in the first tier that still has seats, which is the
  // booking almost everyone is making.
  const [order, setOrder] = useState<OrderLine[]>(() => {
    const first = rates.find((r) => r.capacity - r.bookedCount > 0) ?? rates[0]
    return [{ tierId: first?.id ?? null, adults: 1, children: 0 }]
  })
  const [state, formAction, pending] = useActionState(
    submitGuestBooking,
    initialState,
  )

  const isMember = Boolean(memberPrefill)
  // One rate card per tier — or exactly one, unlabelled, when the class has
  // none. Null child price on a card means it has no child rate.
  const quote = quoteOrder(
    session.price_currency,
    discountFrom(session.discount_type, session.discount_value),
    rates,
    order,
  )
  // The discounted total is what gets charged, so it drives the flow too — a
  // 100% discount makes this a free booking with no payment step.
  // The class's own setting decides whether money is due now; the currency
  // only decides who could take it. A won-priced class set to on-site keeps
  // the "pay when you arrive" route a foreign card has no alternative to.
  const mode = paymentMode(quote.total, session.payment_method)
  // Never offer more seats than exist. The booking transaction checks this
  // again under a lock, so a class that fills up meanwhile is caught there.
  const spotsLeft = Math.max(0, session.capacity - session.booked_count)
  const maxSize = Math.min(MAX_PARTY_SIZE, spotsLeft)
  const isParty = quote.size > 1
  const isEmpty = quote.size === 0
  // With one rate card and one person, the struck-through list price still
  // reads better than a total — a sum of one hides the discount.
  const soloLine = quote.lines.find((l) => l.quote.size === 1)
  const soloPriced =
    soloLine && soloLine.quote.party.children === 1 && soloLine.quote.child
      ? soloLine.quote.child
      : soloLine?.quote.adult

  const setLine = (
    tierId: string | null,
    next: { adults: number; children: number },
  ) => {
    setOrder((prev) => {
      const rest = prev.filter((l) => l.tierId !== tierId)
      if (next.adults + next.children === 0) return rest
      return [...rest, { tierId, ...next }]
    })
  }

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
                // Controlled now: the transfer panel below quotes this back as
                // the name to put on the deposit, so it has to follow typing.
                value={name}
                onChange={(e) => setName(e.target.value)}
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

          <OrderPicker
            quote={quote}
            onChange={setLine}
            maxSize={maxSize}
            disabled={pending}
          />

          <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            {isEmpty ? (
              "Choose how many people are coming."
            ) : mode === "free" ? (
              <>
                <span className="font-medium">Free class</span> — no payment
                required.{" "}
                {isParty ? `Reserving ${quote.size} spots.` : "Reserve your spot below."}
              </>
            ) : (
              <>
                {/* A party is quoted as one total; a single booking keeps the
                    struck-through list price, which a sum of one would hide. */}
                {isParty || !soloPriced ? (
                  <>
                    {quote.size} {quote.size === 1 ? "person" : "people"} — total{" "}
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
                  : bank
                    ? " — pay on-site when you arrive, or by bank transfer below."
                    : " — pay on-site at the studio when you arrive."}
              </>
            )}
          </p>

          <CouponField
            sessionId={session.id}
            email={email}
            lines={orderLines(quote)}
            disabled={pending}
            initialCode={initialCoupon}
          />

          {/* Before the button, not after it. Somebody deciding whether to
              reserve a won class is deciding whether they can pay for it, and
              the answer to that has been on the next page until now.

              The amount tracks the party picker above, so it is right while it
              is being read. It is the pre-coupon total: a code entered here is
              only verified on submit, and printing a discounted figure beside
              an account number on the strength of an unverified code is how
              the wrong amount gets transferred. */}
          {mode === "onsite" && bank && !isEmpty ? (
            <div className="mt-6">
              <BankTransferDetails
                bank={bank}
                amount={quote.total}
                reference={name.trim() || undefined}
              />
            </div>
          ) : null}

          {state.error ? (
            <p className="mt-4 text-sm text-destructive">{state.error}</p>
          ) : null}

          {/* 전자상거래법 requires the withdrawal period and the refund basis
              where somebody is about to commit — not only on a page they could
              go and find. Built from the same table /refunds renders, so the
              two cannot drift. */}
          {mode !== "free" ? (
            <div className="mt-6 rounded-2xl border border-border bg-muted/30 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              <p>{WITHDRAWAL_NOTICE}</p>
              <p className="mt-1">
                {refundSummary()}.{" "}
                <Link href="/refunds" className="underline underline-offset-2">
                  취소·환불규정
                </Link>
              </p>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={pending || isEmpty}
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
