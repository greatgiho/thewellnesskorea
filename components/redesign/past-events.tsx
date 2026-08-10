import Image from "next/image"
import { Section, SectionHeader } from "@/components/redesign/primitives"
import type { PastEventItem } from "@/lib/schedule/map-redesign-content"

/**
 * The archive, as the design original lays it out: one row of tall photographs,
 * desaturated until hovered, each captioned with its season and title.
 *
 * Four across at desktop, which is what the grid is built for — MAX_ITEMS keeps
 * it to a single full row rather than leaving two orphans on a second one.
 *
 * The copy here is not run through the language toggle. The original wrote it
 * in English, and the season strings this reads come out of an en-US formatter
 * (see toPastEvents), so switching only the headings would leave the section
 * half-translated. Translating it means translating the data too.
 *
 * No state and no hooks, so this stays a server component: page.tsx builds it
 * and hands it to LanguageProvider as children, and none of it ships as JS.
 */
const MAX_ITEMS = 4

export function PastEvents({ events }: { events: PastEventItem[] }) {
  const shown = events.slice(0, MAX_ITEMS)

  return (
    <Section id="past" tone="muted">
      <SectionHeader
        eyebrow="지난 기록 · Past Events"
        heading="Moments we've held together"
        lead="A quiet archive of past gatherings — the seasons we've moved through, and the stillness we've shared."
      />

      {shown.length === 0 ? (
        <p className="mt-12 text-sm leading-relaxed text-muted-foreground text-pretty">
          No past gatherings are on record yet.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((event) => (
            <figure key={event.id} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={event.image}
                  alt={`${event.title} — ${event.season}`}
                  fill
                  className="object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-xs uppercase tracking-widest text-background/80">
                    {event.season}
                  </p>
                  <p className="font-serif text-xl text-background">{event.title}</p>
                </figcaption>
              </div>
              {event.note && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {event.note}
                </p>
              )}
            </figure>
          ))}
        </div>
      )}
    </Section>
  )
}
