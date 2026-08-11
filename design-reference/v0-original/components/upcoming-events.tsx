import { Calendar, MapPin } from "lucide-react"

const EVENTS = [
  {
    date: { month: "APR", day: "12" },
    title: "Spring Sound Bath",
    time: "Sat · 4:00 PM",
    place: "Brickwell Courtyard",
    body: "A seasonal sound bath as the courtyard trees come into leaf. Followed by warm barley tea.",
    tag: "Sound",
  },
  {
    date: { month: "APR", day: "27" },
    title: "Morning Grounding Walk",
    time: "Sun · 8:30 AM",
    place: "Seochon & Brickwell",
    body: "A quiet walk through Seochon's old alleys, ending with breathing practice at the reflecting pool.",
    tag: "Walking",
  },
  {
    date: { month: "MAY", day: "10" },
    title: "Tea & Stillness Evening",
    time: "Fri · 7:00 PM",
    place: "Glass House",
    body: "An evening tea meditation with artist Shin Kyung-hee, holding space as dusk settles over the city.",
    tag: "Tea",
  },
]

export function UpcomingEvents() {
  return (
    <section id="upcoming" className="scroll-mt-20 bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">다가오는 · Upcoming</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
              What&apos;s coming to Brickwell
            </h2>
          </div>
          <a
            href="#reserve"
            className="rounded-full border border-border px-5 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
          >
            Reserve a seat
          </a>
        </div>

        <div className="mt-12 divide-y divide-border border-y border-border">
          {EVENTS.map((e) => (
            <article
              key={e.title}
              className="grid grid-cols-[auto_1fr] gap-6 py-8 sm:grid-cols-[auto_1fr_auto] sm:items-center"
            >
              <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg bg-secondary text-center">
                <span className="text-xs uppercase tracking-widest text-[var(--sage)]">{e.date.month}</span>
                <span className="font-serif text-3xl text-foreground">{e.date.day}</span>
              </div>

              <div className="col-span-1">
                <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
                  {e.tag}
                </span>
                <h3 className="mt-2 font-serif text-2xl text-foreground">{e.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground text-pretty">{e.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                    {e.time}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                    {e.place}
                  </span>
                </div>
              </div>

              <a
                href="#reserve"
                className="col-span-2 justify-self-start rounded-full bg-primary px-5 py-2.5 text-center text-sm text-primary-foreground transition-opacity hover:opacity-90 sm:col-span-1 sm:justify-self-end"
              >
                Reserve
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
