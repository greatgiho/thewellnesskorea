import Image from "next/image"
import { Clock, Users } from "lucide-react"

const PROGRAMS = [
  {
    kr: "명상의 시간",
    title: "Meditation Journey",
    duration: "90 min",
    group: "Up to 10",
    body: "A guided arc through the space — singing-bowl breathing in the garden, a mindful walk to the glass house, warm tea meditation, and a deep sound bath in the vertical courtyard.",
    image: "/images/meditation-program.jpeg",
  },
  {
    kr: "브릭웰 정원",
    title: "Grounding & Walking",
    duration: "60 min",
    group: "Up to 12",
    body: "Slow walking meditation through the Brickwell courtyard, ending at the reflecting pool. A gentle reset for the senses, held in the middle of the city.",
    image: "/images/courtyard-tree.jpeg",
  },
  {
    kr: "사운드 배스",
    title: "Sound Bath & Tea",
    duration: "75 min",
    group: "Up to 8",
    body: "Lie beneath the open sky as sound rises through the vertical space, then close with a quiet seasonal tea ceremony. An evening of emptying out.",
    image: "/images/brickwell-atrium.jpeg",
  },
]

export function Programs() {
  return (
    <section id="programs" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">프로그램 · Programs</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
            Programs shaped by the space and the season
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            Each program moves with the rhythm of Brickwell — grounding, walking, holding, and emptying. Choose the one
            that meets you today.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map((p) => (
            <article
              key={p.title}
              className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-lg"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={p.image || "/placeholder.svg"}
                  alt={`${p.title} at The Wellness Korea`}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="font-serif text-lg text-[var(--sage)]">{p.kr}</p>
                <h3 className="mt-1 font-serif text-2xl text-foreground">{p.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground text-pretty">{p.body}</p>
                <div className="mt-5 flex items-center gap-5 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    {p.group}
                  </span>
                </div>
                <a
                  href="#reserve"
                  className="mt-6 inline-block text-sm font-medium text-foreground underline-offset-4 hover:underline"
                >
                  Reserve this program →
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
