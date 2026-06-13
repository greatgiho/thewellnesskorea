"use client"

import { useRef } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { Path } from "@/lib/paths/paths-data"
import { PathCard } from "./path-card"

type PathSectionProps = {
  paths: Path[]
}

export function PathSection({ paths }: PathSectionProps) {
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
    <section id="paths" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="mx-auto max-w-2xl text-center lg:mx-0 lg:text-left">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
              Five Paths
            </p>
            <h2 className="mt-5 text-balance font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">
              다섯 가지 길로 회복하는 시간
            </h2>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              비움에서 누림까지 — 마음을 비우고, 몸을 깨우고, 손으로 짓고, 좋은
              것으로 채우고, 온전히 누리는 웰니스의 흐름.
            </p>
          </div>

          <div className="hidden shrink-0 gap-3 lg:flex">
            <button
              type="button"
              onClick={() => scroll("left")}
              aria-label="Previous paths"
              className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              aria-label="Next paths"
              className="flex size-12 items-center justify-center rounded-full border border-border text-foreground transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
            >
              <ArrowRight className="size-5" />
            </button>
          </div>
        </div>

        {/* Mobile & tablet: vertical stack */}
        <div className="mt-16 flex flex-col gap-6 lg:hidden">
          {paths.map((path) => <PathCard key={path.key} path={path} />)}
        </div>

        {/* Desktop: horizontal carousel */}
        <div
          ref={scrollRef}
          className="hide-scrollbar mt-16 hidden snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 lg:flex"
        >
          {paths.map((path) => <PathCard key={path.key} path={path} />)}
        </div>
      </div>
    </section>
  )
}
