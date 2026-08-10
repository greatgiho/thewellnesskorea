import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { TicketDetails } from "@/components/booking/ticket-details"
import { getTicketByToken, ticketQrSvg } from "@/lib/bookings/checkin"
import { formatBookingDateTime } from "@/lib/bookings/format"

export const metadata: Metadata = {
  title: "Your ticket — The Wellness Korea",
  description: "Show this at the door to check in.",
}

// A ticket is only true for as long as the booking is. Caching it would show a
// cancelled reservation as valid, or a checked-in one as unused.
export const dynamic = "force-dynamic"

type TicketPageProps = {
  params: Promise<{ token: string }>
}

export default async function TicketPage({ params }: TicketPageProps) {
  const { token } = await params
  const ticket = await getTicketByToken(token)

  if (!ticket) notFound()

  // Reachable by anyone holding the link, so a cancelled booking has to say so
  // rather than render as an admittable ticket.
  const cancelled = ticket.status !== "confirmed"
  const qr = cancelled ? null : await ticketQrSvg(token)
  const checkedIn = ticket.checkedInAt
    ? formatBookingDateTime(ticket.checkedInAt, ticket.checkedInAt).timeRange
    : null

  return (
    <BookingPageLayout
      eyebrow="Ticket"
      title={cancelled ? "This ticket is no longer valid." : "Your ticket"}
      description={
        cancelled
          ? "This reservation is not confirmed, so it cannot be used to check in."
          : "Show this at the door. Our staff will scan it to check you in."
      }
    >
      <div className="space-y-8">
        {qr ? (
          <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
            {/* Rendered as inline SVG on the server: no QR library ships to the
                browser, and it stays sharp on whatever screen it is scanned
                from. Wrapped in white regardless of theme, because a scanner
                needs the quiet zone to be light. */}
            <div
              className="mx-auto w-full max-w-[280px] rounded-2xl bg-white p-4 [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qr }}
            />
            {ticket.checkedInAt ? (
              <p className="mt-6 rounded-2xl bg-primary/10 px-4 py-3 text-center text-sm text-foreground">
                Checked in at {checkedIn}
              </p>
            ) : (
              <p className="mt-6 text-center text-xs text-muted-foreground">
                Screen brightness helps if the scan is slow.
              </p>
            )}
          </div>
        ) : null}

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <TicketDetails ticket={ticket} />
        </div>
      </div>
    </BookingPageLayout>
  )
}
