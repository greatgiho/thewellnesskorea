import Image from "next/image"

const PAST = [
  {
    title: "Winter Silence Retreat",
    season: "Jan 2026",
    image: "/images/reflecting-pool.jpeg",
    note: "Three quiet mornings of breath and warm tea as snow settled over the courtyard.",
  },
  {
    title: "Metta Meditation Lab",
    season: "Nov 2025",
    image: "/images/meditation-program.jpeg",
    note: "A collaboration bringing grounding, walking, and sound practice through the vertical space.",
  },
  {
    title: "Autumn Courtyard Sound Bath",
    season: "Oct 2025",
    image: "/images/brickwell-atrium.jpeg",
    note: "Sound rose through the open atrium as the trees turned — a full evening of emptying out.",
  },
  {
    title: "Seochon Grounding Walk",
    season: "Sep 2025",
    image: "/images/courtyard-tree.jpeg",
    note: "A slow walk through the neighborhood's old alleys into the stillness of Brickwell.",
  },
]

export function PastEvents() {
  return (
    <section id="past" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">지난 기록 · Past Events</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
            Moments we&apos;ve held together
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            A quiet archive of past gatherings — the seasons we&apos;ve moved through, and the stillness we&apos;ve
            shared.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PAST.map((e) => (
            <figure key={e.title} className="group">
              <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                <Image
                  src={e.image || "/placeholder.svg"}
                  alt={`${e.title} — ${e.season}`}
                  fill
                  className="object-cover grayscale-[35%] transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                <figcaption className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-xs uppercase tracking-widest text-background/80">{e.season}</p>
                  <p className="font-serif text-xl text-background">{e.title}</p>
                </figcaption>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">{e.note}</p>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
