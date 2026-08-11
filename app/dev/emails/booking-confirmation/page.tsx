import { notFound } from "next/navigation"
import { getBookingSummaryById } from "@/lib/bookings/queries"
import { renderBookingConfirmationEmail } from "@/lib/notifications/email-templates"
import { getCheckinTokenForBookingId } from "@/lib/bookings/checkin"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { siteOrigin } from "@/lib/site-origin"

/**
 * The confirmation email, rendered in the browser instead of sent.
 *
 * This exists because "is the deployment I am looking at sending the new email
 * or the old one?" turned out to be unanswerable without booking something and
 * waiting for mail — and when the answer was no, it was because the booking had
 * happened on a different deployment than the one being looked at. Two ways to
 * be wrong at once, neither visible.
 *
 * Open it on any deployment and it shows what that deployment would send, no
 * booking and no mail involved. The origin it prints is the one its links are
 * built from, which is the other thing that silently differs per environment.
 *
 * Same gate as /dev/redesign: always in local dev, in production only behind
 * ENABLE_DEV_REDESIGN. Real production leaves it unset and gets a 404.
 */
export const dynamic = "force-dynamic"

function enabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_DEV_REDESIGN === "true"
  )
}

type Props = { searchParams: Promise<{ booking?: string }> }

export default async function BookingConfirmationEmailPreview({
  searchParams,
}: Props) {
  if (!enabled()) notFound()

  const { booking: bookingId } = await searchParams
  if (!bookingId) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="font-serif text-2xl text-foreground">
          Booking confirmation email
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Add <code>?booking=&lt;booking id&gt;</code> to see what this
          deployment would send.
        </p>
        <p className="mt-6 text-sm text-muted-foreground">
          Origin used for links: <code>{siteOrigin()}</code>
        </p>
      </main>
    )
  }

  const summary = await getBookingSummaryById(bookingId)
  if (!summary) notFound()

  const checkinToken = await getCheckinTokenForBookingId(bookingId)
  const { heading, timeRange } = formatBookingDateTime(
    summary.sessionStartsAt,
    summary.sessionEndsAt,
  )

  const html = await renderBookingConfirmationEmail({
    guestName: summary.guestName,
    details: {
      sessionTitle: summary.sessionTitle,
      heading,
      timeRange,
      floorName: summary.floorName,
      instructorName: summary.instructorName,
    },
    ticketUrl: checkinToken ? `${siteOrigin()}/t/${checkinToken}` : null,
    cancelUrl: `${siteOrigin()}/book/cancel/CANCEL_TOKEN`,
    scheduleUrl: `${siteOrigin()}/#upcoming`,
  })

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="font-serif text-2xl text-foreground">
        Booking confirmation email
      </h1>
      <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
        <div>
          origin <code className="text-foreground">{siteOrigin()}</code>
        </div>
        <div>
          ticket{" "}
          <code className="text-foreground">
            {checkinToken ? `/t/${checkinToken}` : "none — no checkin_token"}
          </code>
        </div>
      </dl>
      {/* The email as the recipient's client would receive it. */}
      <iframe
        title="Rendered email"
        srcDoc={html}
        className="mt-6 h-[900px] w-full rounded-2xl border border-border bg-white"
      />
    </main>
  )
}
