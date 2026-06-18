import { formatBookingDateTime } from "@/lib/bookings/format"
import type { BookingSummary } from "@/lib/bookings/queries"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { mapSessionToClassItem } from "@/lib/schedule/map-public-class"

type BookingSessionSummaryProps = {
  session?: SessionWithRelations | null
  summary?: BookingSummary | null
}

export function BookingSessionSummary({
  session,
  summary,
}: BookingSessionSummaryProps) {
  const title = summary?.sessionTitle ?? session?.title ?? "Class"
  const startsAt = summary?.sessionStartsAt ?? session?.starts_at
  const endsAt = summary?.sessionEndsAt ?? session?.ends_at
  const floorName =
    summary?.floorName ?? session?.floor?.name_en ?? "Brickwell"
  const instructorName =
    summary?.instructorName ?? session?.instructor?.name_en ?? "Wellness Guide"

  if (!startsAt || !endsAt) return null

  const { heading, timeRange } = formatBookingDateTime(startsAt, endsAt)
  const spots =
    session != null
      ? mapSessionToClassItem(session).spots
      : null

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Class details
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-foreground">
        {title}
      </h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Date</dt>
          <dd className="mt-0.5 text-foreground">{heading}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Time</dt>
          <dd className="mt-0.5 text-foreground">{timeRange}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Floor</dt>
          <dd className="mt-0.5 text-foreground">{floorName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Guide</dt>
          <dd className="mt-0.5 text-foreground">{instructorName}</dd>
        </div>
        {spots != null ? (
          <div>
            <dt className="text-muted-foreground">Availability</dt>
            <dd className="mt-0.5 text-foreground">
              {spots === 0 ? "Full" : `${spots} spots left`}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  )
}
