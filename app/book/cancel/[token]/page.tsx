import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { CancelBookingPanel } from "@/components/booking/cancel-booking-panel"
import { getBookingSummaryByCancelToken } from "@/lib/bookings/queries"

export const metadata: Metadata = {
  title: "Cancel reservation — The Wellness Korea",
  description: "Cancel your class reservation at Brickwell.",
}

type CancelBookingPageProps = {
  params: Promise<{ token: string }>
}

export default async function CancelBookingPage({
  params,
}: CancelBookingPageProps) {
  const { token } = await params
  const summary = await getBookingSummaryByCancelToken(token)

  if (!summary) {
    notFound()
  }

  return (
    <BookingPageLayout
      eyebrow="Cancellation"
      title="Cancel your reservation?"
      description="Your spot will be released for others. You'll receive a confirmation email after cancelling."
    >
      <CancelBookingPanel cancelToken={token} summary={summary} />
    </BookingPageLayout>
  )
}
