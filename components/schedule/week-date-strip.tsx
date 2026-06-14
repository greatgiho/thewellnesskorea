import type { WeekDay } from "./types"

type WeekDateStripProps = {
  week: WeekDay[]
  selectedDay: string
  onSelectDay: (key: string) => void
}

export function WeekDateStrip({
  week,
  selectedDay,
  onSelectDay,
}: WeekDateStripProps) {
  return (
    <div className="mt-12 flex items-center gap-3">
      <div className="flex-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex gap-3">
          {week.map((day) => {
            const isActive = day.key === selectedDay
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDay(day.key)}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-3xl px-5 py-4 transition-all duration-300 ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-card text-foreground hover:bg-secondary"
                }`}
                aria-pressed={isActive}
              >
                <span
                  className={`text-xs font-medium uppercase tracking-wider ${
                    isActive
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground"
                  }`}
                >
                  {day.name}
                </span>
                <span className="font-serif text-2xl leading-none">
                  {day.date}
                </span>
                {day.isToday && (
                  <span
                    className={`mt-0.5 size-1.5 rounded-full ${
                      isActive ? "bg-primary-foreground" : "bg-primary"
                    }`}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
