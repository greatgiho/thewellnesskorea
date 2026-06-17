"use client"

import { useRef } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"
import type { Path } from "@/lib/paths/paths-data"
import { PathSlide } from "./path-slide"

type PathSectionProps = {
  paths: Path[]
}

export function PathSection({ paths }: PathSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({
      left: direction === "left" ? -el.clientWidth : el.clientWidth,
      behavior: "smooth",
    })
  }

  return (
    <section
      id="paths"
      className="relative h-svh w-full shrink-0 snap-start snap-always overflow-hidden bg-foreground"
    >
      <div
        ref={scrollRef}
        className="hide-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
      >
        {paths.map((path, index) => (
          <PathSlide
            key={path.key}
            path={path}
            index={index}
            total={paths.length}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center px-6 pt-24 lg:pt-28">
        <div className="pointer-events-auto max-w-2xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/70">
            Five Paths
          </p>
          <h2 className="mt-3 text-balance font-serif text-3xl font-light text-white sm:text-4xl">
            Five ways to restore your time
          </h2>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden items-center pl-4 lg:flex">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Previous path"
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden items-center pr-4 lg:flex">
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Next path"
          className="pointer-events-auto flex size-11 items-center justify-center rounded-full border border-white/30 bg-black/20 text-white backdrop-blur-sm transition-colors hover:bg-black/40"
        >
          <ArrowRight className="size-5" />
        </button>
      </div>

      <p className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-xs text-white/60 lg:hidden">
        Swipe to explore each path
      </p>
    </section>
  )
}
