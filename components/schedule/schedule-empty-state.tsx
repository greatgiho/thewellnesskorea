import type { ExperienceRow } from "@/lib/experiences/types"
import { experienceEyebrow } from "@/lib/experiences/copy"

type ScheduleEmptyStateProps = {
  experience: ExperienceRow
}

export function ScheduleEmptyState({ experience }: ScheduleEmptyStateProps) {
  return (
    <div className="rounded-3xl border border-dashed border-border px-6 py-20 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
        {experienceEyebrow(experience.slug, experience.kind)}
      </p>
      <p className="mt-6 font-serif text-3xl font-light text-foreground">
        {experience.name_en} is opening soon.
      </p>
      <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
        {experience.description_en ??
          "We are preparing the next chapter of The Wellness Korea. Check back for class schedules and reservations."}
      </p>
    </div>
  )
}
