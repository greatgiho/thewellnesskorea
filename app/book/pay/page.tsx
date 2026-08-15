import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { BookingSessionSummary } from "@/components/booking/booking-session-summary"
import { DevMockPaymentButton } from "@/components/booking/dev-mock-payment-button"
import { PaypalCheckoutButton } from "@/components/booking/paypal-checkout-button"
import { TossCheckoutButton } from "@/components/booking/toss-checkout-button"
import {
  money,
  formatMoney,
  onlineProviderFor,
  toTossAmount,
} from "@/lib/payments/money"
import { getPendingBookingPayment } from "@/lib/bookings/payment-queries"

export const metadata: Metadata = {
  title: "Complete payment — The Wellness Korea",
  description: "Complete online payment to confirm your class reservation.",
}

type BookPayPageProps = {
  searchParams: Promise<{ booking?: string }>
}

function formatExpiresAt(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(iso))
}

export default async function BookPayPage({ searchParams }: BookPayPageProps) {
  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    notFound()
  }

  const pending = await getPendingBookingPayment(bookingId)
  if (!pending) {
    notFound()
  }

  if (pending.status === "confirmed") {
    redirect(`/book/confirm?booking=${bookingId}`)
  }

  if (pending.status === "cancelled") {
    return (
      <BookingPageLayout
        eyebrow="Payment"
        title="This hold has expired or was cancelled."
        description="The spot may have been released. Please choose another class from the schedule."
      >
        <Link
          href="/#upcoming"
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to upcoming classes
        </Link>
      </BookingPageLayout>
    )
  }

  const expired =
    pending.expiresAt != null && new Date(pending.expiresAt) <= new Date()

  if (expired) {
    return (
      <BookingPageLayout
        eyebrow="Payment"
        title="Payment window expired."
        description="Your reservation hold timed out after 10 minutes. Please book again if spots remain."
      >
        <Link
          href="/#upcoming"
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to upcoming classes
        </Link>
      </BookingPageLayout>
    )
  }

  const showDevMock =
    process.env.NODE_ENV === "development" &&
    process.env.PAYMENT_DEV_MOCK === "true"

  const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const tossClientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY
  const currency = pending.summary.price.final.currency
  const price = money(currency, pending.amount)

  // Two gates, and the class's own setting comes first: a class marked
  // on-site has no processor even when one could take its currency. Then the
  // currency picks which — PayPal cannot charge won and Toss cannot charge
  // dollars, so that half is not a choice to put in front of anyone. Null for
  // a free ($0) or on-site hold, even if this page is reached directly.
  const provider =
    pending.amount > 0 && pending.summary.paymentMethod !== "onsite"
      ? onlineProviderFor(currency)
      : null
  const showPaypal = provider === "paypal" && Boolean(paypalClientId)
  const showToss = provider === "toss" && Boolean(tossClientKey)

  return (
    <BookingPageLayout
      eyebrow="Payment"
      title="Complete your payment."
      description="Your spot is held temporarily. Complete online payment to confirm your reservation."
    >
      <div className="space-y-8">
        <BookingSessionSummary summary={pending.summary} />

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Amount due
          </p>
          <p className="mt-3 font-serif text-3xl font-light text-foreground">
            {formatMoney(money(currency, pending.amount))}
          </p>
          {pending.expiresAt ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Hold expires at {formatExpiresAt(pending.expiresAt)} (KST). After
              that, your spot will be released.
            </p>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">
            Order reference:{" "}
            <span className="font-mono text-xs text-foreground">
              {pending.merchantUid}
            </span>
          </p>
        </div>

        {showPaypal ? (
          <PaypalCheckoutButton
            bookingId={bookingId}
            clientId={paypalClientId as string}
            currency={currency}
          />
        ) : showToss ? (
          <TossCheckoutButton
            clientKey={tossClientKey as string}
            orderId={pending.merchantUid}
            amount={toTossAmount(price)}
            orderName={pending.summary.sessionTitle}
            customerEmail={pending.guestEmail}
            customerName={pending.guestName}
          />
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            {provider
              ? "Online payment is temporarily unavailable. Please contact us to complete your booking."
              : "This class is paid on-site."}
          </p>
        )}

        {showDevMock ? <DevMockPaymentButton bookingId={bookingId} /> : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/book/cancel/${pending.cancelToken}`}
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Cancel hold
          </Link>
          <Link
            href="/#upcoming"
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            Back to upcoming classes
          </Link>
        </div>
      </div>
    </BookingPageLayout>
  )
}
