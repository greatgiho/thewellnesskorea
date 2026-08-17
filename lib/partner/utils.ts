import { formatKstDate, formatTimeInKst } from "@/lib/time/kst"

export function formatSessionTime(startsAt: string, endsAt: string): string {
  return `${formatKstDate(startsAt, { weekday: true })} ${formatTimeInKst(startsAt)} – ${formatTimeInKst(endsAt)}`
}

export function formatDateOnly(iso: string): string {
  return formatKstDate(iso, { weekday: true })
}

export function isSessionEnded(endsAt: string): boolean {
  return new Date(endsAt) < new Date()
}

/**
 * A hold occupies a seat before its payment settles, so the roster counts it —
 * otherwise the headcount and the names below it disagree. It is not a
 * confirmed attendee though, so it says so. Same wording the member's own
 * booking list uses.
 */
export function isAwaitingPayment(booking: { status: string }): boolean {
  return booking.status === "pending_payment"
}

export const AWAITING_PAYMENT_LABEL = "결제 대기 중"
