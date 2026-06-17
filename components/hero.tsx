import Image from "next/image"
import { ArrowDown } from "lucide-react"

export function Hero() {
  return (
    <section className="relative flex h-svh w-full shrink-0 snap-start snap-always items-end overflow-hidden">
      <Image
        src="/kw-hero.png"
        alt="Circular courtyard of Brickwell in Seochon, Seoul"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35" />

      <div className="relative mx-auto w-full max-w-7xl px-6 pb-16 lg:px-10 lg:pb-24">
        <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-white/80">
          K—Wellness · Seoul
        </p>
        <h1 className="max-w-4xl text-balance font-serif text-5xl font-light leading-[1.05] text-white sm:text-6xl lg:text-7xl">
          Live the time given to you, more fully.
        </h1>
        <p className="mt-8 max-w-xl text-pretty text-lg font-light leading-relaxed text-white/90">
          The Wellness Korea is not a cure or a single moment of healing. It is a
          way of restoring calm, rhythm, and clarity to the way you live each day.
        </p>

        <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <a
            href="#schedule"
            className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-foreground transition-all duration-300 hover:scale-105"
          >
            View the schedule
            <ArrowDown className="size-4" />
          </a>
          <a
            href="#footer"
            className="text-sm font-medium text-white/90 underline-offset-8 transition-colors hover:text-white hover:underline"
          >
            Visit our first Journey in Seochon, Brickwell
          </a>
        </div>
      </div>
    </section>
  )
}
