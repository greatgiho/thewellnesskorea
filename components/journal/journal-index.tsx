"use client"

import { useMemo, useState } from "react"
import type { JournalCardData, JournalCategory } from "@/lib/journal/types"
import { JOURNAL_CATEGORIES } from "@/lib/journal/copy"
import { JournalCard } from "./journal-card"

type JournalIndexProps = {
  posts: JournalCardData[]
  initialCategory?: JournalCategory | "all"
}

export function JournalIndex({
  posts,
  initialCategory = "all",
}: JournalIndexProps) {
  const [activeCategory, setActiveCategory] = useState<JournalCategory | "all">(
    initialCategory,
  )

  const filtered = useMemo(() => {
    if (activeCategory === "all") return posts
    return posts.filter((post) => post.category === activeCategory)
  }, [posts, activeCategory])

  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-32 lg:px-10 lg:pb-32 lg:pt-36">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
          Journal
        </p>
        <h1 className="mt-5 font-serif text-4xl font-light leading-tight text-foreground sm:text-5xl">
          Stories from The Wellness Korea
        </h1>
        <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
          Philosophy, local discovery, taste, Spaces, programs, and news—written
          for a slower read.
        </p>
      </header>

      <div
        className="mt-12 flex flex-wrap gap-2"
        role="tablist"
        aria-label="Journal categories"
      >
        {JOURNAL_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={activeCategory === cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={
              activeCategory === cat.key
                ? "rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-medium text-foreground"
                : "rounded-full border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            }
          >
            {cat.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-3xl border border-dashed border-border px-6 py-20 text-center text-muted-foreground">
          No posts in this category yet.
        </div>
      ) : (
        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:gap-12">
          {filtered.map((post) => (
            <JournalCard key={post.slug} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
