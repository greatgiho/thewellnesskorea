import { formatScheduleDayHeading } from "@/lib/schedule/public-week"
import { formatTimeInKst } from "@/lib/schedule/utils"

/** Format a price in its own currency (KRW = no decimals, USD = 2 decimals). */
export function formatMoney(amount: number, currency: string): string {
  const isKrw = currency === "KRW"
  return new Intl.NumberFormat(isKrw ? "ko-KR" : "en-US", {
    style: "currency",
    currency,
    ...(isKrw ? { maximumFractionDigits: 0 } : {}),
  }).format(amount)
}

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
