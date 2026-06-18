import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { BookingSessionSummary } from "@/components/booking/booking-session-summary"
import { getBookingSummaryById } from "@/lib/bookings/queries"

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
        <BookingSessionSummary summary={summary} />

        <div className="rounded-3xl border border-border bg-secondary/20 px-6 py-8">
          <p className="font-serif text-xl text-foreground">
            See you at Brickwell, Seochon.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Payment is on-site. Please arrive a few minutes early and wear
            comfortable clothing.
          </p>
          <p className="mt-4 text-sm text-foreground">
            Save this booking to an account for easier access next time.
          </p>
          <Link
            href={`/signup?${signupParams.toString()}`}
            className="mt-4 inline-flex rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Create account with this email
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/#schedule"
            className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Back to schedule
          </Link>
          <Link
            href="/login"
            className="inline-flex rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Sign in
          </Link>
        </div>
      </div>
    </BookingPageLayout>
  )
}
