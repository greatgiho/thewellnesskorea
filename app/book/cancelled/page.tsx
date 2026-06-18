import type { Metadata } from "next"
import Link from "next/link"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"

export const metadata: Metadata = {
  title: "Reservation cancelled — The Wellness Korea",
  description: "Your class reservation has been cancelled.",
}

export default function BookCancelledPage() {
  return (
    <BookingPageLayout
      eyebrow="Cancelled"
      title="Your reservation was cancelled."
      description="We've sent a confirmation email. You can book another class anytime spots are available."
    >
      <Link
        href="/#schedule"
        className="inline-flex rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Browse upcoming classes
      </Link>
    </BookingPageLayout>
  )
}
