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
