import { siteOrigin } from "@/lib/site-origin"
import { createServiceClient } from "@/lib/supabase/service"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { BookingSummary } from "@/lib/bookings/queries"
import { sendEmail } from "@/lib/notifications/email"
import {
  renderBookingConfirmationEmail,
  renderBookingCancelledEmail,
  type SessionDetails,
} from "@/lib/notifications/email-templates"

/**
 * The ticket token for a booking that has just been confirmed.
 *
 * Service client: this runs from a server action with no session to speak of
 * — a guest booking has no signed-in user at all — and it reads one column of
 * a row the caller has already proved it owns.
 */
async function getCheckinTokenForBookingId(
  bookingId: string,
): Promise<string | null> {
  const { data, error } = await createServiceClient()
    .from("bookings")
    .select("checkin_token")
    .eq("id", bookingId)
    .maybeSingle()
  if (error || !data) return null
  return (data as { checkin_token: string }).checkin_token
}

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
  const ticketUrl = checkinToken ? `${siteOrigin()}/t/${checkinToken}` : null
  const cancelUrl = `${siteOrigin()}/book/cancel/${cancelToken}`
  const scheduleUrl = `${siteOrigin()}/#schedule`

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
  const scheduleUrl = `${siteOrigin()}/#schedule`

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
