"use client"

import { useMemo, useState } from "react"
import { Clock, Check } from "lucide-react"

type Level = "Beginner" | "Intermediate" | "All Levels"
type Category =
  | "Hatha"
  | "Vinyasa"
  | "Yin Yoga"
  | "Sound Healing"
  | "Meditation"

type ClassItem = {
  id: string
  start: string
  end: string
  duration: string
  title: string
  category: Category
  level: Level
  teacher: string
  initials: string
  spots: number
  period: "AM" | "PM"
}

const categories: ("All" | Category)[] = [
  "All",
  "Hatha",
  "Vinyasa",
  "Yin Yoga",
  "Sound Healing",
  "Meditation",
]

// Build a rolling 7-day strip starting today
function buildWeek() {
  const days = []
  const today = new Date()
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      key: d.toISOString().slice(0, 10),
      name: dayNames[d.getDay()],
      date: d.getDate(),
      isToday: i === 0,
    })
  }
  return days
}

// A deterministic schedule keyed by day-of-week
const scheduleByDay: Record<string, ClassItem[]> = {
  0: [
    {
      id: "s1",
      start: "09:00",
      end: "10:15",
      duration: "75 min",
      title: "Slow Sunday Hatha",
      category: "Hatha",
      level: "All Levels",
      teacher: "Ji-woo Han",
      initials: "JH",
      spots: 8,
      period: "AM",
    },
    {
      id: "s2",
      start: "16:00",
      end: "17:00",
      duration: "60 min",
      title: "Sound Bath & Singing Bowls",
      category: "Sound Healing",
      level: "All Levels",
      teacher: "Mina Seo",
      initials: "MS",
      spots: 3,
      period: "PM",
    },
  ],
  default: [
    {
      id: "d1",
      start: "08:30",
      end: "09:45",
      duration: "75 min",
      title: "Morning Vinyasa Flow",
      category: "Vinyasa",
      level: "Intermediate",
      teacher: "Soo-ah Lim",
      initials: "SL",
      spots: 5,
      period: "AM",
    },
    {
      id: "d2",
      start: "10:30",
      end: "11:30",
      duration: "60 min",
      title: "Gentle Hatha Grounding",
      category: "Hatha",
      level: "Beginner",
      teacher: "Ji-woo Han",
      initials: "JH",
      spots: 12,
      period: "AM",
    },
    {
      id: "d3",
      start: "12:30",
      end: "13:15",
      duration: "45 min",
      title: "Midday Stillness Meditation",
      category: "Meditation",
      level: "All Levels",
      teacher: "Tae-yang Oh",
      initials: "TO",
      spots: 0,
      period: "PM",
    },
    {
      id: "d4",
      start: "17:30",
      end: "18:45",
      duration: "75 min",
      title: "Yin & Deep Release",
      category: "Yin Yoga",
      level: "All Levels",
      teacher: "Mina Seo",
      initials: "MS",
      spots: 6,
      period: "PM",
    },
    {
      id: "d5",
      start: "19:30",
      end: "20:30",
      duration: "60 min",
      title: "Evening Sound Healing",
      category: "Sound Healing",
      level: "All Levels",
      teacher: "Mina Seo",
      initials: "MS",
      spots: 2,
      period: "PM",
    },
  ] as ClassItem[],
}

function getClassesForDay(dayIndex: number): ClassItem[] {
  return scheduleByDay[dayIndex] ?? scheduleByDay.default
}

const categoryAccent: Record<Category, string> = {
  Hatha: "bg-[oklch(0.9_0.02_120)] text-primary",
  Vinyasa: "bg-[oklch(0.88_0.04_145)] text-primary",
  "Yin Yoga": "bg-[oklch(0.9_0.03_90)] text-[oklch(0.45_0.05_70)]",
  "Sound Healing": "bg-[oklch(0.9_0.025_60)] text-[oklch(0.45_0.06_55)]",
  Meditation: "bg-secondary text-primary",
}

export function Schedule() {
  const week = useMemo(buildWeek, [])
  const [selectedDay, setSelectedDay] = useState(week[0].key)
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All")
  const [booked, setBooked] = useState<Record<string, boolean>>({})

  const selected = week.find((d) => d.key === selectedDay) ?? week[0]
  const dayIndex = new Date(selected.key).getDay()

  const classes = useMemo(() => {
    const all = getClassesForDay(dayIndex)
    return activeCategory === "All"
      ? all
      : all.filter((c) => c.category === activeCategory)
  }, [dayIndex, activeCategory])

  return (
    <section id="schedule" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        {/* Heading */}
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
            Daily Classes
          </p>
          <h2 className="mt-5 text-balance font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">
            Find a moment in your week.
          </h2>
          <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
            Reserve your place across movement, stillness, and sound. Every
            session is held in a calm, unhurried space.
          </p>
        </div>

        {/* Weekly date strip */}
        <div className="mt-12 flex items-center gap-3">
          <div className="flex-1 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex gap-3">
              {week.map((day) => {
                const isActive = day.key === selectedDay
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => setSelectedDay(day.key)}
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

        {/* Category filters */}
        <div className="mt-8 flex flex-wrap gap-2.5">
          {categories.map((cat) => {
            const isActive = cat === activeCategory
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-transparent text-foreground/70 hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {cat}
              </button>
            )
          })}
        </div>

        {/* Timeline list */}
        <div className="mt-10 flex flex-col gap-4">
          {classes.length === 0 && (
            <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
              <p className="font-serif text-2xl text-foreground">
                No {activeCategory} classes today.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try another day or category.
              </p>
            </div>
          )}

          {classes.map((c) => {
            const isBooked = booked[`${selectedDay}-${c.id}`]
            const isFull = c.spots === 0
            return (
              <article
                key={c.id}
                className="group flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 transition-all duration-300 hover:scale-[1.01] hover:border-primary/30 hover:shadow-lg hover:shadow-foreground/5 sm:flex-row sm:items-center sm:gap-8 sm:p-7"
              >
                {/* Time */}
                <div className="flex shrink-0 flex-row items-center gap-4 sm:w-40 sm:flex-col sm:items-start sm:gap-1">
                  <div className="font-serif text-2xl leading-none text-foreground">
                    {c.start}
                    <span className="text-base text-muted-foreground">
                      {" "}
                      {c.period}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span>
                      {c.duration} · ends {c.end}
                    </span>
                  </div>
                </div>

                {/* Details */}
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
                    <span className="text-sm text-muted-foreground">
                      with {c.teacher}
                    </span>
                  </div>
                </div>

                {/* Action */}
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
                    onClick={() =>
                      setBooked((prev) => ({
                        ...prev,
                        [`${selectedDay}-${c.id}`]: !prev[`${selectedDay}-${c.id}`],
                      }))
                    }
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
          })}
        </div>
      </div>
    </section>
  )
}
