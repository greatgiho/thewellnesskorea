import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { BookingSessionSummary } from "@/components/booking/booking-session-summary"
import { DevMockPaymentButton } from "@/components/booking/dev-mock-payment-button"
import { formatKrw } from "@/lib/bookings/format"
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
          href="/#schedule"
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to schedule
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
          href="/#schedule"
          className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Back to schedule
        </Link>
      </BookingPageLayout>
    )
  }

  const showDevMock =
    process.env.NODE_ENV === "development" &&
    process.env.PAYMENT_DEV_MOCK === "true"

  return (
    <BookingPageLayout
      eyebrow="Payment"
      title="Complete your payment."
      description="Your spot is held temporarily. Online checkout (PortOne / Toss) will open here once integrated."
    >
      <div className="space-y-8">
        <BookingSessionSummary summary={pending.summary} />

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Amount due
          </p>
          <p className="mt-3 font-serif text-3xl font-light text-foreground">
            {formatKrw(pending.amount)}
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

        {showDevMock ? <DevMockPaymentButton bookingId={bookingId} /> : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/book/cancel/${pending.cancelToken}`}
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Cancel hold
          </Link>
          <Link
            href="/#schedule"
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
          >
            Back to schedule
          </Link>
        </div>
      </div>
    </BookingPageLayout>
  )
}
