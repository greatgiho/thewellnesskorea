import Image from "next/image"
import { Clock, Users } from "lucide-react"
import type { ProgramItem } from "@/lib/schedule/map-redesign-content"

export function Programs({ programs }: { programs: ProgramItem[] }) {
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

        {programs.length === 0 ? (
          <p className="mt-14 text-sm leading-relaxed text-muted-foreground text-pretty">
            No programs are open for booking right now. Please check back soon.
          </p>
        ) : (
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((p) => (
              <article
                key={p.id}
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
                  <h3 className="font-serif text-2xl text-foreground">{p.title}</h3>
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
        )}
      </div>
    </section>
  )
}
