import type { Category } from "./types"
import { CATEGORIES } from "./schedule-data"

type CategoryFiltersProps = {
  activeCategory: "All" | Category
  onChange: (category: "All" | Category) => void
}

export function CategoryFilters({
  activeCategory,
  onChange,
}: CategoryFiltersProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-2.5">
      {CATEGORIES.map((cat) => {
        const isActive = cat === activeCategory
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className={`rounded-full border px-4 py-2 text-sm transition-all duration-300 ${
              isActive
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-transparent text-foreground/70 hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        )
      })}
    </div>
  )
}
