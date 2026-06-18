"use client"

import { useExperienceHome } from "@/components/experiences/experience-home-context"
import { ScheduleEmptyState } from "./schedule-empty-state"
import { ScheduleExperiencePanel } from "./schedule-experience-panel"
import { ScheduleHeader } from "./schedule-header"

export function Schedule() {
  const { experiences, setScheduleTrackEl } = useExperienceHome()

  return (
    <section id="schedule" className="overflow-hidden bg-background py-24 lg:py-32">
      <div
        ref={setScheduleTrackEl}
        className="flex w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ touchAction: "pan-x pinch-zoom" }}
      >
        {experiences.map((experience) => (
          <div
            key={experience.id}
            className="min-w-full shrink-0 snap-center snap-always"
          >
            <div className="mx-auto max-w-5xl px-6 lg:px-10">
              <ScheduleHeader experience={experience} />
              {experience.schedule_enabled ? (
                <ScheduleExperiencePanel />
              ) : (
                <ScheduleEmptyState experience={experience} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
