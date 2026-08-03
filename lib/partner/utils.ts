const KST = "Asia/Seoul"

function toKST(iso: string): Date {
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: KST }))
}

export function formatSessionTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)

  const dateStr = start.toLocaleDateString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
  const startTime = start.toLocaleTimeString("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
  })
  const endTime = end.toLocaleTimeString("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${dateStr} ${startTime} – ${endTime}`
}

export function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
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
