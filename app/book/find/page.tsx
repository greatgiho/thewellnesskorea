import type { Metadata } from "next"
import Link from "next/link"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { FindBookingForm } from "@/components/booking/find-booking-form"

export const metadata: Metadata = {
  title: "Find your reservation — The Wellness Korea",
  description:
    "Lost the confirmation email? We can send your ticket and cancellation links again.",
  // Nothing here for a search engine, and a page about retrieving someone's
  // reservation is not one to have indexed.
  robots: { index: false },
}

export default function FindBookingPage() {
  return (
    <BookingPageLayout
      eyebrow="Reservations"
      title="Find your reservation."
      description="Booked without an account? Your ticket and cancellation links live in the confirmation email. We can send them again."
    >
      <div className="space-y-8">
        <FindBookingForm />

        <p className="text-sm leading-relaxed text-muted-foreground">
          Have an account? Your reservations are on your{" "}
          <Link
            href="/u/bookings"
            className="text-foreground underline underline-offset-4"
          >
            bookings page
          </Link>
          . Signing up with the same email you booked with brings past guest
          reservations across.
        </p>
      </div>
    </BookingPageLayout>
  )
}
