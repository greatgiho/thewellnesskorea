"use client"

import { useExperienceHome } from "./experience-home-context"
import { ExperienceDots } from "./experience-dots"
import { HeroSlide } from "./hero-slide"

export function HeroCarousel() {
  const { experiences, setHeroTrackEl } = useExperienceHome()

  return (
    <section
      id="hero"
      className="relative h-svh w-full shrink-0 snap-start snap-always overflow-hidden"
    >
      <div
        ref={setHeroTrackEl}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: "pan-x pan-y" }}
      >
        {experiences.map((experience) => (
          <HeroSlide key={experience.id} experience={experience} />
        ))}
      </div>
      <ExperienceDots variant="hero" />
    </section>
  )
}
