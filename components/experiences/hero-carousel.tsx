"use client"

import { useExperienceHome } from "./experience-home-context"
import { ExperienceDots } from "./experience-dots"
import { HeroSlide } from "./hero-slide"

export function HeroCarousel() {
  const { experiences, setHeroTrackEl } = useExperienceHome()

  return (
    <section
      id="hero"
      className="relative h-svh w-full shrink-0 overflow-hidden lg:snap-start lg:snap-always"
    >
      <div
        ref={setHeroTrackEl}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {experiences.map((experience) => (
          <HeroSlide key={experience.id} experience={experience} />
        ))}
      </div>
      <ExperienceDots variant="hero" />
    </section>
  )
}
