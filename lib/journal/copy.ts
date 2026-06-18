import type { JournalCategory } from "./types"

export const JOURNAL_CATEGORIES: { key: JournalCategory | "all"; label: string }[] =
  [
    { key: "all", label: "All" },
    { key: "philosophy", label: "Philosophy" },
    { key: "space", label: "Space" },
    { key: "programs", label: "Programs" },
    { key: "news", label: "News" },
  ]

export function journalCategoryLabel(category: JournalCategory): string {
  const found = JOURNAL_CATEGORIES.find((c) => c.key === category)
  return found?.label ?? category
}
