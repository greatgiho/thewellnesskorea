import { experienceEyebrow } from "@/lib/experiences/copy"
import type { ExperienceRow } from "@/lib/experiences/types"

type ScheduleHeaderProps = {
  experience: ExperienceRow
}

export function ScheduleHeader({ experience }: ScheduleHeaderProps) {
  const comingSoon = !experience.schedule_enabled

  return (
    <div className="max-w-2xl">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
        {comingSoon
          ? experienceEyebrow(experience.slug, experience.kind)
          : "Daily Classes"}
      </p>
      <h2 className="mt-5 text-balance font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">
        {comingSoon
          ? `${experience.name_en} is on the way.`
          : "Find a moment in your week."}
      </h2>
      <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
        {comingSoon
          ? (experience.description_en ??
            "Our next Space will open with its own rhythm of classes and gatherings.")
          : "Upcoming classes, in date order."}
      </p>
    </div>
  )
}
