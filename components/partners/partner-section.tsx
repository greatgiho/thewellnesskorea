"use client"

import { useRef } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { PartnerCardData } from "@/lib/partners/types"
import { PartnerCard } from "./partner-card"

type PartnerSectionProps = {
  id: string
  eyebrow?: string
  title: string
  description: string
  partners: PartnerCardData[]
  prevLabel: string
  nextLabel: string
  emptyMessage?: string
  className?: string
}

export function PartnerSection({
  id,
  eyebrow,
  title,
  description,
  partners,
  prevLabel,
  nextLabel,
  emptyMessage = "No profiles to display yet.",
  className = "bg-background py-24 lg:py-32",
}: PartnerSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    })
  }

  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            {eyebrow && (
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-5 text-balance font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">
              {title}
            </h2>
            <p className="mt-5 max-w-md text-pretty leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          {partners.length > 0 && (
            <div className="hidden gap-3 sm:flex">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label={prevLabel}
                className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowLeft className="size-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label={nextLabel}
                className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
              >
                <ArrowRight className="size-5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {partners.length === 0 ? (
        <div className="mx-auto mt-14 max-w-7xl px-6 lg:px-10">
          <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="hide-scrollbar mt-14 flex w-full snap-x snap-mandatory gap-6 overflow-x-auto overscroll-x-contain scroll-smooth px-6 pb-4 [-webkit-overflow-scrolling:touch] lg:px-10"
        >
          {partners.map((person) => (
            <PartnerCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </section>
  )
}
