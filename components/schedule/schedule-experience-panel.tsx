"use client"

import { useMemo, useState } from "react"
import type { ClassItem } from "./types"
import { CategoryFilters } from "./category-filters"
import { ScheduleChronologicalList } from "./schedule-chronological-list"

type ScheduleExperiencePanelProps = {
  sessions: ClassItem[]
}

export function ScheduleExperiencePanel({ sessions }: ScheduleExperiencePanelProps) {
  const [activeCategory, setActiveCategory] = useState("All")

  const categories = useMemo(() => {
    const labels = new Set(sessions.map((s) => s.categoryLabel))
    return ["All", ...Array.from(labels).sort((a, b) => a.localeCompare(b, "ko"))]
  }, [sessions])

  const filteredSessions = useMemo(() => {
    if (activeCategory === "All") return sessions
    return sessions.filter((s) => s.categoryLabel === activeCategory)
  }, [sessions, activeCategory])

  return (
    <>
      <p className="mt-10 font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Upcoming
      </p>
      {categories.length > 1 ? (
        <CategoryFilters
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />
      ) : null}
      <div className="mt-10">
        <ScheduleChronologicalList
          sessions={filteredSessions}
          activeCategory={activeCategory}
        />
      </div>
    </>
  )
}
