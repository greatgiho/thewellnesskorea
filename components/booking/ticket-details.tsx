import { formatBookingDateTime } from "@/lib/bookings/format"
import type { TicketSummary } from "@/lib/bookings/checkin"

/**
 * The facts on a ticket, shown identically to the holder and to the door.
 *
 * One component for both on purpose: the person scanning is checking that the
 * name and the class in front of them match the ones on the phone, and that
 * comparison is easier when the two screens are laid out the same way.
 */
export function TicketDetails({ ticket }: { ticket: TicketSummary }) {
  const { heading, timeRange } = formatBookingDateTime(
    ticket.sessionStartsAt,
    ticket.sessionEndsAt,
  )

  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-muted-foreground">Guest</dt>
        <dd className="mt-0.5 font-serif text-2xl text-foreground">
          {ticket.guestName}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">Class</dt>
        <dd className="mt-0.5 text-base text-foreground">
          {ticket.sessionTitle}
        </dd>
      </div>
      <div>
        <dt className="text-muted-foreground">When</dt>
        <dd className="mt-0.5 text-base text-foreground">
          {heading} · {timeRange}
        </dd>
      </div>
      {ticket.floorName ? (
        <div>
          <dt className="text-muted-foreground">Where</dt>
          <dd className="mt-0.5 text-base text-foreground">{ticket.floorName}</dd>
        </div>
      ) : null}
      {ticket.instructorName ? (
        <div>
          <dt className="text-muted-foreground">With</dt>
          <dd className="mt-0.5 text-base text-foreground">
            {ticket.instructorName}
          </dd>
        </div>
      ) : null}
    </dl>
  )
}
