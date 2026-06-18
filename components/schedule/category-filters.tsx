type PathFiltersProps = {
  categories: string[]
  activeCategory: string
  onChange: (category: string) => void
}

export function CategoryFilters({
  categories,
  activeCategory,
  onChange,
}: PathFiltersProps) {
  return (
    <div className="mt-8 flex flex-wrap gap-2.5">
      {categories.map((cat) => {
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
