"use client"

import { useMemo, useState } from "react"
import { JournalCover } from "./journal-cover"
import { JournalStory } from "./journal-story"
import { journalCategoryLabel } from "@/lib/journal/copy"
import type { JournalCardData, JournalCategory } from "@/lib/journal/types"

type Props = {
  posts: JournalCardData[]
  initialCategory?: JournalCategory | "all"
}

/**
 * Client shell: sticky category filter + story list.
 * Server parent (`app/journal/page.tsx`) fetches posts and passes them here —
 * no re-fetching on filter change.
 *
 * Navbar is `fixed top-0 z-50` with ~65 px height (py-5 + font line-height).
 * Sticky filter sits at `top-[65px]` so it clears the navbar.
 */
export function JournalView({ posts, initialCategory = "all" }: Props) {
  const [activeCategory, setActiveCategory] = useState<JournalCategory | "all">(
    initialCategory,
  )

  // Build category list from the actual posts (distinct, preserving order).
  const categories = useMemo<Array<{ key: JournalCategory | "all"; label: string }>>(
    () => {
      const seen = new Set<string>()
      const result: Array<{ key: JournalCategory | "all"; label: string }> = [
        { key: "all", label: "All" },
      ]
      for (const post of posts) {
        if (!seen.has(post.category)) {
          seen.add(post.category)
          result.push({
            key: post.category,
            label: journalCategoryLabel(post.category),
          })
        }
      }
      return result
    },
    [posts],
  )

  const filtered = useMemo(
    () =>
      activeCategory === "all"
        ? posts
        : posts.filter((p) => p.category === activeCategory),
    [posts, activeCategory],
  )

  return (
    <>
      {/* ── Magazine cover ── */}
      <JournalCover />

      {/* ── Sticky category filter ── */}
      <div className="sticky top-[65px] z-40 border-b border-border/50 bg-background/90 backdrop-blur-md">
        <nav
          className="flex items-center gap-8 overflow-x-auto px-6 py-3.5 md:px-12"
          aria-label="Filter stories by category"
        >
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setActiveCategory(cat.key)}
              aria-pressed={activeCategory === cat.key}
              className={`shrink-0 whitespace-nowrap text-xs uppercase tracking-[0.28em] transition-colors duration-200 ${
                activeCategory === cat.key
                  ? "font-semibold text-foreground underline underline-offset-4 decoration-primary/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Stories ── */}
      {filtered.length === 0 ? (
        <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
          No stories in this category yet.
        </div>
      ) : (
        filtered.map((post, i) => (
          <JournalStory key={post.slug} post={post} index={i} />
        ))
      )}
    </>
  )
}
