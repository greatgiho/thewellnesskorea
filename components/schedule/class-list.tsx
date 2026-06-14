import type { Category, ClassItem } from "./types"
import { ClassCard } from "./class-card"

type ClassListProps = {
  classes: ClassItem[]
  selectedDay: string
  activeCategory: "All" | Category
  booked: Record<string, boolean>
  onToggleBook: (classId: string) => void
}

export function ClassList({
  classes,
  selectedDay,
  activeCategory,
  booked,
  onToggleBook,
}: ClassListProps) {
  if (classes.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-serif text-2xl text-foreground">
          No {activeCategory} classes today.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try another day or category.
        </p>
      </div>
    )
  }

  return (
    <>
      {classes.map((c) => {
        const bookingKey = `${selectedDay}-${c.id}`
        return (
          <ClassCard
            key={c.id}
            classItem={c}
            selectedDay={selectedDay}
            isBooked={booked[bookingKey] ?? false}
            onToggleBook={() => onToggleBook(c.id)}
          />
        )
      })}
    </>
  )
}
