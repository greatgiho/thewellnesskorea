"use client"

import { useState } from "react"
import Image from "next/image"
import type { PastEventItem } from "@/lib/schedule/map-redesign-content"

// Same active/hover accordion strip as Brickwell's day/night/exhibition
// panels — one panel active by default (wide, title+season visible), the
// rest collapsed to a vertical label; click toggles which is active. No
// reserve button here, so unlike UpcomingEvents there's no visibility
// trade-off in matching Brickwell exactly.
//
// Images are a temporary /placeholder.svg (see
// lib/schedule/map-redesign-content.ts's TEMP_PLACEHOLDER_IMAGE) until
// real poster images are set per event.
const MAX_ITEMS = 6

const T = {
  open: (label: string) => `Open ${label}`,
}

export function PastEvents({ events }: { events: PastEventItem[] }) {
  const shown = events.slice(0, MAX_ITEMS)
  const [active, setActive] = useState<string | null>(shown[0]?.id ?? null)

  return (
    <section id="past" className="scroll-mt-20 bg-secondary/40 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">지난 기록 · Past Events</p>
          <h2 className="mt-4 font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl">
            Moments we&apos;ve held together
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
            A quiet archive of past gatherings
            <br />
            — the seasons we&apos;ve moved through, and the stillness we&apos;ve shared.
          </p>
        </div>

        {shown.length === 0 ? (
          <p className="mt-14 text-sm leading-relaxed text-muted-foreground text-pretty">
            No past gatherings are on record yet.
          </p>
        ) : (
          <div className="mt-14 hidden h-[420px] gap-px overflow-hidden rounded-2xl bg-border shadow-sm md:flex">
            {shown.map((e) => {
              const isActive = e.id === active
              const toggle = () => setActive((prev) => (prev === e.id ? null : e.id))
              return (
                <div
                  key={e.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isActive}
                  aria-label={T.open(e.title)}
                  onClick={toggle}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      ev.preventDefault()
                      toggle()
                    }
                  }}
                  className={`group relative cursor-pointer overflow-hidden transition-[flex-grow] duration-500 ease-out ${
                    isActive ? "flex-[3.4]" : "flex-[1] hover:flex-[1.7]"
                  }`}
                >
                  <Image
                    src={e.image || "/placeholder.svg"}
                    alt={`${e.title} — ${e.season}`}
                    fill
                    className={`object-cover grayscale-[35%] transition-transform duration-700 ${
                      isActive ? "scale-100 grayscale-0" : "scale-110 group-hover:scale-105"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/85 via-foreground/30 to-transparent" />

                  {isActive ? (
                    <div className="relative flex h-full flex-col justify-end p-7">
                      <p className="text-xs uppercase tracking-widest text-background/80">{e.season}</p>
                      <p className="mt-2 max-w-md font-serif text-2xl leading-snug text-background text-pretty">
                        {e.title}
                      </p>
                    </div>
                  ) : (
                    <div className="relative flex h-full items-end justify-center p-5">
                      <span
                        className="font-serif text-xl tracking-wide text-background"
                        style={{ writingMode: "vertical-rl" }}
                      >
                        {e.season}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Mobile: plain photo grid — a strip of thin slivers doesn't work at phone width */}
        {shown.length > 0 && (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 md:hidden">
            {shown.map((e) => (
              <figure key={e.id} className="group">
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg">
                  <Image
                    src={e.image || "/placeholder.svg"}
                    alt={`${e.title} — ${e.season}`}
                    fill
                    className="object-cover grayscale-[35%]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
                  <figcaption className="absolute inset-x-0 bottom-0 p-4">
                    <p className="text-xs uppercase tracking-widest text-background/80">{e.season}</p>
                    <p className="font-serif text-xl text-background">{e.title}</p>
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
