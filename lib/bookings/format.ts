import { formatScheduleDayHeading } from "@/lib/schedule/public-week"
import { formatTimeInKst } from "@/lib/schedule/utils"

export function formatBookingDateTime(
  startsAt: string,
  endsAt: string,
): { heading: string; timeRange: string } {
  const dateKey = startsAt.slice(0, 10)
  const start = formatTimeInKst(startsAt)
  const end = formatTimeInKst(endsAt)
  return {
    heading: formatScheduleDayHeading(dateKey),
    timeRange: `${start} – ${end} (KST)`,
  }
}

/**
 * A party, in words: "2 adults · 1 child".
 *
 * One booking now admits several people, and the number has to read the same
 * on the ticket, at the door, in the confirmation email and on the roster —
 * three of those are being compared against each other by someone standing in
 * a doorway. Omits a rate nobody on the booking is using rather than printing
 * "0 children".
 */
export function formatParty(adults: number, children: number): string {
  const parts: string[] = []
  if (adults > 0) parts.push(`${adults} ${adults === 1 ? "adult" : "adults"}`)
  if (children > 0) {
    parts.push(`${children} ${children === 1 ? "child" : "children"}`)
  }
  return parts.join(" · ")
}
