import { siteOrigin } from "@/lib/apply/config"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { BookingSummary } from "@/lib/bookings/queries"
import { sendResendEmail } from "@/lib/notifications/resend"
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
  const cancelUrl = `${siteOrigin()}/book/cancel/${cancelToken}`
  const scheduleUrl = `${siteOrigin()}/#schedule`

  const html = await renderBookingConfirmationEmail({
    guestName: summary.guestName,
    details: toSessionDetails(summary),
    cancelUrl,
    scheduleUrl,
  })

  await sendResendEmail(
    summary.guestEmail,
    "[TWK] Your class reservation is confirmed",
    html,
    "booking-confirmation",
  )
}

export async function sendBookingCancelledEmail(
  summary: BookingSummary,
): Promise<void> {
  const scheduleUrl = `${siteOrigin()}/#schedule`

  const html = await renderBookingCancelledEmail({
    guestName: summary.guestName,
    details: toSessionDetails(summary),
    scheduleUrl,
  })

  await sendResendEmail(
    summary.guestEmail,
    "[TWK] Your class reservation was cancelled",
    html,
    "booking-cancelled",
  )
}
