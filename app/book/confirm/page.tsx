import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { BookingSessionSummary } from "@/components/booking/booking-session-summary"
import { TicketQr } from "@/components/booking/ticket-qr"
import { BankTransferNotice } from "@/components/booking/bank-transfer-notice"
import { PartyAdmits } from "@/components/booking/party-admits"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import { getBookingAmount } from "@/lib/bookings/amount"
import { getCheckinTokenForBookingId } from "@/lib/bookings/checkin"
import { getOptionalMemberSession } from "@/lib/auth/require-session"
import { paymentMode } from "@/lib/payments/money"

export const metadata: Metadata = {
  title: "Reservation confirmed — The Wellness Korea",
  description: "Your class reservation at Brickwell is confirmed.",
}

type BookConfirmPageProps = {
  searchParams: Promise<{ booking?: string }>
}

export default async function BookConfirmPage({
  searchParams,
}: BookConfirmPageProps) {
  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    notFound()
  }

  const summary = await getBookingSummaryById(bookingId)
  if (!summary || summary.status !== "confirmed") {
    notFound()
  }

  const member = await getOptionalMemberSession()
  // The ticket belongs here, not only in the email. A guest booking has no
  // account to come back to, and the confirmation email is skipped outright
  // when BREVO_API_KEY is unset — so without this there are environments where
  // a guest can book and never reach their ticket at all.
  const checkinToken = await getCheckinTokenForBookingId(bookingId)

  // What this booking owes, not what the class lists at. Party size, seat
  // tiers and any coupon all live below the session row — see
  // lib/bookings/amount. Falls back to the class price only if the derivation
  // fails outright, which is the old behaviour and still better than a blank
  // where an amount should be.
  const amount = await getBookingAmount(bookingId)

  // Same three-way split as the booking form and /book/pay, so a free class
  // never reads as "pay on-site". Against the amount owed rather than the
  // class price: a coupon covering the whole thing leaves nothing to pay, and
  // asking that person to transfer ₩0 is worse than saying nothing.
  const mode = paymentMode(
    amount?.total ?? summary.price.final,
    summary.paymentMethod,
  )
  const paymentNote = {
    free: "This class is free — nothing to pay.",
    online: "Your online payment is confirmed.",
    onsite: "Payment is on-site.",
  }[mode]

  const signupParams = new URLSearchParams({
    email: summary.guestEmail,
    name: summary.guestName,
  })

  return (
    <BookingPageLayout
      eyebrow="Confirmed"
      title="You're reserved."
      description="We've sent a confirmation email with your class details and a link to cancel if needed."
    >
      <div className="space-y-8">
        {/* Nothing could charge this booking — a won price with Toss
            suspended, or a class set to pay in person. Saying "payment is
            on-site" and stopping there leaves somebody holding a reservation
            with no way to act on it until they arrive. */}
        {mode === "onsite" ? (
          <BankTransferNotice
            amount={amount?.total ?? summary.price.final}
            listAmount={amount?.discount ? amount.listTotal : null}
            discount={amount?.discount ?? null}
            reference={summary.guestName}
          />
        ) : null}

        {checkinToken ? (
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            <TicketQr token={checkinToken} />
            {/* One code for the whole booking, so it has to say what it lets
                in — the person who booked is the one bringing the others. */}
            {summary.partySize > 1 ? (
              <p className="mt-5 flex items-center justify-center gap-3 text-center">
                <span className="text-sm text-muted-foreground">Admits</span>
                <PartyAdmits
                  adults={summary.adultCount}
                  children={summary.childCount}
                />
              </p>
            ) : null}
            <Link
              href={`/t/${checkinToken}`}
              className="mx-auto mt-6 flex w-fit rounded-full border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              Open ticket
            </Link>
          </div>
        ) : null}

        <BookingSessionSummary summary={summary} />

        <div className="rounded-3xl border border-border bg-secondary/20 px-6 py-8">
          <p className="font-serif text-xl text-foreground">
            See you at Brickwell, Seochon.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {paymentNote} Please arrive a few minutes early and wear
            comfortable clothing.
          </p>
          {!member ? (
            <>
              <p className="mt-4 text-sm text-foreground">
                Save this booking to an account for easier access next time.
              </p>
              <Link
                href={`/u/signup?${signupParams.toString()}`}
                className="mt-4 inline-flex rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Create account with this email
              </Link>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/#upcoming"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to upcoming classes
          </Link>
          <Link
            href={member ? "/u/bookings" : "/u/signin"}
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {member ? "My reservations" : "Sign in"}
          </Link>
        </div>
      </div>
    </BookingPageLayout>
  )
}
