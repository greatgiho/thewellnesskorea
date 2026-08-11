import { deploymentOrigin } from "@/lib/site-origin"
import { getCheckinTokenForBookingId } from "@/lib/bookings/checkin"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { BookingSummary } from "@/lib/bookings/queries"
import { sendEmail } from "@/lib/notifications/email"
import {
  renderBookingConfirmationEmail,
  renderBookingCancelledEmail,
  type SessionDetails,
} from "@/lib/notifications/email-templates"

function toSessionDetails(summary: BookingSummary): SessionDetails {
  const { heading, timeRange } = formatBookingDateTime(
    summary.sessionStartsAt,
    summary.sessionEndsAt,
  )
  return {
    sessionTitle: summary.sessionTitle,
    heading,
    timeRange,
    floorName: summary.floorName,
    instructorName: summary.instructorName,
  }
}

export async function sendBookingConfirmationEmail(
  summary: BookingSummary,
  cancelToken: string,
): Promise<void> {
  // Looked up here rather than threaded through the three callers, each of
  // which already carries a cancel token from a different place. The booking
  // exists by now, so this is one read, not a new parameter on three paths.
  const checkinToken = await getCheckinTokenForBookingId(summary.bookingId)
  const ticketUrl = checkinToken ? `${deploymentOrigin()}/t/${checkinToken}` : null
  const cancelUrl = `${deploymentOrigin()}/book/cancel/${cancelToken}`
  const scheduleUrl = `${deploymentOrigin()}/#schedule`

  const html = await renderBookingConfirmationEmail({
    guestName: summary.guestName,
    details: toSessionDetails(summary),
    ticketUrl,
    cancelUrl,
    scheduleUrl,
  })

  await sendEmail(
    summary.guestEmail,
    "[TWK] Your class reservation is confirmed",
    html,
    "booking-confirmation",
  )
}

export async function sendBookingCancelledEmail(
  summary: BookingSummary,
): Promise<void> {
  const scheduleUrl = `${deploymentOrigin()}/#schedule`

  const html = await renderBookingCancelledEmail({
    guestName: summary.guestName,
    details: toSessionDetails(summary),
    scheduleUrl,
  })

  await sendEmail(
    summary.guestEmail,
    "[TWK] Your class reservation was cancelled",
    html,
    "booking-cancelled",
  )
}
