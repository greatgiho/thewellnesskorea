"use client"

import { useMemo, useState } from "react"
import type { Category } from "./types"
import { buildWeek, getClassesForDay } from "./schedule-data"
import { CategoryFilters } from "./category-filters"
import { ClassList } from "./class-list"
import { ScheduleHeader } from "./schedule-header"
import { WeekDateStrip } from "./week-date-strip"

export function Schedule() {
  const week = useMemo(buildWeek, [])
  const [selectedDay, setSelectedDay] = useState(week[0].key)
  const [activeCategory, setActiveCategory] = useState<"All" | Category>("All")
  const [booked, setBooked] = useState<Record<string, boolean>>({})

  const selected = week.find((d) => d.key === selectedDay) ?? week[0]
  const dayIndex = new Date(selected.key).getDay()

  const classes = useMemo(() => {
    const all = getClassesForDay(dayIndex)
    return activeCategory === "All"
      ? all
      : all.filter((c) => c.category === activeCategory)
  }, [dayIndex, activeCategory])

  const toggleBook = (classId: string) => {
    const key = `${selectedDay}-${classId}`
    setBooked((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <section id="schedule" className="bg-background py-24 lg:py-32">
      <div className="mx-auto max-w-5xl px-6 lg:px-10">
        <ScheduleHeader />
        <WeekDateStrip
          week={week}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
        <CategoryFilters
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />
        <div className="mt-10 flex flex-col gap-4">
          <ClassList
            classes={classes}
            selectedDay={selectedDay}
            activeCategory={activeCategory}
            booked={booked}
            onToggleBook={toggleBook}
          />
        </div>
      </div>
    </section>
  )
}
