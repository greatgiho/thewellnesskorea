import { Clock, Check } from "lucide-react"
import type { ClassItem } from "./types"
import { categoryAccent } from "./schedule-data"

type ClassCardProps = {
  classItem: ClassItem
  selectedDay: string
  isBooked: boolean
  onToggleBook: () => void
}

export function ClassCard({
  classItem: c,
  isBooked,
  onToggleBook,
}: ClassCardProps) {
  const isFull = c.spots === 0

  return (
    <article
      className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg hover:shadow-foreground/5 sm:flex-row sm:items-center sm:gap-8 sm:p-7"
    >
      <div className="flex shrink-0 flex-row items-center gap-4 sm:w-40 sm:flex-col sm:items-start sm:gap-1">
        <div className="font-serif text-2xl leading-none text-foreground">
          {c.start}
          <span className="text-base text-muted-foreground"> {c.period}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" />
          <span>
            {c.duration} · ends {c.end}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1 border-border sm:border-l sm:pl-8">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryAccent[c.category]}`}
          >
            {c.category}
          </span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            {c.level}
          </span>
        </div>
        <h3 className="mt-2 font-serif text-xl font-medium text-foreground">
          {c.title}
        </h3>
        <div className="mt-3 flex items-center gap-2.5">
          <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-[0.7rem] font-medium text-primary">
            {c.initials}
          </span>
          <span className="text-sm text-muted-foreground">with {c.teacher}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:w-40 sm:flex-col sm:items-end sm:justify-center sm:gap-3">
        <span
          className={`text-xs font-medium ${
            isFull
              ? "text-muted-foreground"
              : c.spots <= 3
                ? "text-[oklch(0.55_0.12_55)]"
                : "text-primary"
          }`}
        >
          {isFull ? "Waitlist only" : `${c.spots} spots left`}
        </span>
        <button
          type="button"
          disabled={isFull && !isBooked}
          onClick={onToggleBook}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-medium transition-all duration-300 ${
            isBooked
              ? "bg-secondary text-primary"
              : isFull
                ? "cursor-not-allowed border border-border text-muted-foreground"
                : "bg-primary text-primary-foreground hover:scale-105 hover:bg-primary/90"
          }`}
        >
          {isBooked ? (
            <>
              <Check className="size-4" />
              Booked
            </>
          ) : isFull ? (
            "Join waitlist"
          ) : (
            "Book"
          )}
        </button>
      </div>
    </article>
  )
}
