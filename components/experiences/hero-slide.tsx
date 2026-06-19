import Image from "next/image"
import { ArrowDown } from "lucide-react"
import { experienceEyebrow } from "@/lib/experiences/copy"
import type { ExperienceRow } from "@/lib/experiences/types"

type HeroSlideProps = {
  experience: ExperienceRow
}

export function HeroSlide({ experience }: HeroSlideProps) {
  const eyebrow = experienceEyebrow(experience.slug, experience.kind)
  const comingSoon = !experience.schedule_enabled

  return (
    <article className="relative h-svh w-full shrink-0 snap-center overflow-hidden lg:snap-always">
      {experience.hero_image_path ? (
        <Image
          src={experience.hero_image_path}
          alt={`${experience.name_en} hero`}
          fill
          priority={experience.sort_order === 0}
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black"
          aria-hidden
        />
      )}

      <div
        className={
          comingSoon
            ? "absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/55"
            : "absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-black/35"
        }
      />

      <div className="relative flex h-full items-end">
        <div className="mx-auto w-full max-w-7xl px-6 pb-24 lg:px-10 lg:pb-28">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-white/80">
            {eyebrow}
          </p>
          <h1 className="max-w-4xl text-balance font-serif text-5xl font-light leading-[1.05] text-white sm:text-6xl lg:text-7xl">
            {experience.headline_en ?? experience.name_en}
          </h1>
          {experience.description_en ? (
            <p className="mt-8 max-w-xl text-pretty text-lg font-light leading-relaxed text-white/90">
              {experience.description_en}
            </p>
          ) : null}

          <div className="mt-12 flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {comingSoon ? (
              <span className="inline-flex items-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-medium text-white/70">
                Opening soon
              </span>
            ) : (
              <a
                href="#schedule"
                className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-foreground transition-all duration-300 hover:scale-105"
              >
                View the schedule
                <ArrowDown className="size-4" />
              </a>
            )}
            {experience.secondary_link_label_en &&
            experience.secondary_link_href ? (
              <a
                href={experience.secondary_link_href}
                className="text-sm font-medium text-white/90 underline-offset-8 transition-colors hover:text-white hover:underline"
              >
                {experience.secondary_link_label_en}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  )
}
