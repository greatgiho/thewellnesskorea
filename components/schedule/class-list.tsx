import type { ClassItem } from "./types"
import { ClassCard } from "./class-card"

type ClassListProps = {
  classes: ClassItem[]
  selectedDay: string
  activeCategory: string
}

export function ClassList({
  classes,
  activeCategory,
}: ClassListProps) {
  if (classes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-serif text-2xl text-foreground">
          {activeCategory === "All"
            ? "No classes scheduled for this day."
            : `No ${activeCategory} classes today.`}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another day or path.
        </p>
      </div>
    )
  }

  return (
    <>
      {classes.map((c) => (
        <ClassCard key={c.id} classItem={c} />
      ))}
    </>
  )
}
