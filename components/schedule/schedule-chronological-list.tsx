import { formatScheduleDayHeading } from "@/lib/schedule/public-week"
import type { ClassItem } from "./types"
import { ClassCard } from "./class-card"

type ScheduleChronologicalListProps = {
  sessions: ClassItem[]
  activeCategory: string
}

export function ScheduleChronologicalList({
  sessions,
  activeCategory,
}: ScheduleChronologicalListProps) {
  if (sessions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-serif text-2xl text-foreground">
          {activeCategory === "All"
            ? "No upcoming classes scheduled."
            : `No ${activeCategory} classes scheduled.`}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          New sessions are added regularly—please check back soon.
        </p>
      </div>
    )
  }

  const byDate = new Map<string, ClassItem[]>()
  for (const session of sessions) {
    const list = byDate.get(session.dateKey) ?? []
    list.push(session)
    byDate.set(session.dateKey, list)
  }

  const dateKeys = Array.from(byDate.keys()).sort((a, b) => a.localeCompare(b))

  return (
    <div className="flex flex-col gap-12">
      {dateKeys.map((dateKey) => {
        const daySessions = byDate.get(dateKey) ?? []
        return (
          <section key={dateKey}>
            <h3 className="font-serif text-2xl font-light text-foreground">
              {formatScheduleDayHeading(dateKey)}
            </h3>
            <div className="mt-6 flex flex-col gap-4">
              {daySessions.map((session) => (
                <ClassCard key={session.id} classItem={session} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
