import type { SessionWithRelations } from "@/lib/schedule/types"
import { PersonSessionListItem } from "./person-session-list-item"

type PersonUpcomingSessionsProps = {
  sessions: SessionWithRelations[]
}

export function PersonUpcomingSessions({ sessions }: PersonUpcomingSessionsProps) {
  return (
    <section className="space-y-6">
      <div>
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
          Schedule
        </p>
        <h2 className="mt-3 font-serif text-3xl font-light text-foreground sm:text-4xl">
          Upcoming Classes
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Confirmed sessions open for booking. Visit the schedule section on our
          homepage to reserve your spot.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <p className="font-serif text-lg text-foreground">No upcoming classes</p>
          <p className="mt-2 text-sm text-muted-foreground">
            New sessions will appear here once published.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sessions.map((session) => (
            <PersonSessionListItem key={session.id} session={session} />
          ))}
        </ul>
      )}
    </section>
  )
}
