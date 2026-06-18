"use client"

import { cn } from "@/lib/utils"
import { useExperienceHome } from "./experience-home-context"

type ExperienceDotsProps = {
  className?: string
  variant?: "hero" | "schedule"
}

export function ExperienceDots({
  className,
  variant = "hero",
}: ExperienceDotsProps) {
  const { experiences, activeIndex, goToExperience } = useExperienceHome()

  if (experiences.length <= 1) return null

  return (
    <div
      className={cn(
        "flex items-center justify-center gap-2",
        variant === "hero" && "absolute inset-x-0 bottom-8 z-10",
        className,
      )}
      role="tablist"
      aria-label="Experiences"
    >
      {experiences.map((experience, index) => (
        <button
          key={experience.id}
          type="button"
          role="tab"
          aria-selected={index === activeIndex}
          aria-label={experience.name_en}
          onClick={() => goToExperience(index)}
          className={cn(
            "rounded-full transition-all duration-300",
            variant === "hero"
              ? cn(
                  "h-2",
                  index === activeIndex
                    ? "w-8 bg-white"
                    : "w-2 bg-white/45 hover:bg-white/70",
                )
              : cn(
                  "h-2",
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "w-2 bg-border hover:bg-muted-foreground/40",
                ),
          )}
        />
      ))}
    </div>
  )
}
