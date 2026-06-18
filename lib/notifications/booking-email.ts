import { siteOrigin } from "@/lib/apply/config"
import { formatBookingDateTime } from "@/lib/bookings/format"
import type { BookingSummary } from "@/lib/bookings/queries"

async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM_EMAIL
  if (!apiKey || !from) {
    console.warn("[booking-email] RESEND_API_KEY or NOTIFY_FROM_EMAIL missing")
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[booking-email] send failed:", res.status, body)
    throw new Error("Failed to send booking email.")
  }
}

function sessionDetailsHtml(summary: BookingSummary): string {
  const { heading, timeRange } = formatBookingDateTime(
    summary.sessionStartsAt,
    summary.sessionEndsAt,
  )
  return `
    <ul>
      <li><strong>Class:</strong> ${summary.sessionTitle}</li>
      <li><strong>When:</strong> ${heading}</li>
      <li><strong>Time:</strong> ${timeRange}</li>
      <li><strong>Floor:</strong> ${summary.floorName}</li>
      <li><strong>Guide:</strong> ${summary.instructorName}</li>
    </ul>
  `
}

export async function sendBookingConfirmationEmail(
  summary: BookingSummary,
  cancelToken: string,
): Promise<void> {
  const cancelUrl = `${siteOrigin()}/book/cancel/${cancelToken}`
  const scheduleUrl = `${siteOrigin()}/#schedule`

  const subject = "[TWK] Your class reservation is confirmed"
  const html = `
    <p>Hi ${summary.guestName},</p>
    <p>Your reservation at The Wellness Korea is confirmed.</p>
    ${sessionDetailsHtml(summary)}
    <p>
      <a href="${scheduleUrl}">View the schedule</a>
    </p>
    <p>
      Need to cancel?
      <a href="${cancelUrl}">Cancel this reservation</a>
    </p>
    <p>We look forward to welcoming you at Brickwell, Seochon.</p>
  `

  await sendResendEmail(summary.guestEmail, subject, html)
}

export async function sendBookingCancelledEmail(
  summary: BookingSummary,
): Promise<void> {
  const scheduleUrl = `${siteOrigin()}/#schedule`
  const subject = "[TWK] Your class reservation was cancelled"
  const html = `
    <p>Hi ${summary.guestName},</p>
    <p>Your reservation has been cancelled as requested.</p>
    ${sessionDetailsHtml(summary)}
    <p>
      <a href="${scheduleUrl}">Browse upcoming classes</a>
    </p>
  `

  await sendResendEmail(summary.guestEmail, subject, html)
}
