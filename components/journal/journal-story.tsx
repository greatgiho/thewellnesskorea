"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"
import { useReveal } from "./use-reveal"
import { journalCategoryLabel } from "@/lib/journal/copy"
import type { JournalCardData } from "@/lib/journal/types"

type Props = {
  post: JournalCardData
  index: number
}

/**
 * One fullscreen story section.
 * - Background image with subtle parallax drift (reduced-motion safe).
 * - Text block alternates left/right by index.
 * - Text reveals (opacity + translateY) when section enters the viewport.
 */
export function JournalStory({ post, index }: Props) {
  const sectionRef = useRef<HTMLElement>(null)
  const imgRef = useRef<HTMLDivElement>(null)
  const revealed = useReveal(sectionRef, 0.3)
  const isLeft = index % 2 === 0

  // Parallax: gently drift the background image as the section scrolls.
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches
    if (prefersReduced) return

    const handleScroll = () => {
      const el = sectionRef.current
      const img = imgRef.current
      if (!el || !img) return
      const { top } = el.getBoundingClientRect()
      // Drift ±~40 px over the section's visible range.
      const offset = top * 0.08
      img.style.transform = `scale(1.1) translateY(${offset}px)`
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-screen items-end overflow-hidden"
    >
      {/* Background image */}
      <div
        ref={imgRef}
        className="absolute inset-0 scale-110"
        style={{
          backgroundImage: post.heroImage
            ? `url(${post.heroImage})`
            : "linear-gradient(135deg, oklch(0.22 0.025 155), oklch(0.32 0.035 145))",
          backgroundSize: "cover",
          backgroundPosition: "center",
          willChange: "transform",
        }}
        aria-hidden
      />

      {/* Gradient overlay — direction mirrors text placement */}
      <div
        aria-hidden
        className={`absolute inset-0 ${
          isLeft
            ? "bg-gradient-to-r from-foreground/75 via-foreground/25 to-transparent"
            : "bg-gradient-to-l from-foreground/75 via-foreground/25 to-transparent"
        }`}
      />

      {/* Text block */}
      <div
        className={`relative z-10 flex w-full px-6 pb-16 pt-24 md:px-12 md:pb-24 ${
          isLeft ? "justify-start" : "justify-end"
        }`}
      >
        <Link
          href={`/journal/${post.slug}`}
          className="group block max-w-lg"
          aria-label={`Read: ${post.title}`}
        >
          <div
            className={`transition-all duration-700 ease-out ${
              revealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
          >
            {/* Category label */}
            <p className="mb-5 text-xs uppercase tracking-[0.32em] text-white/55">
              {journalCategoryLabel(post.category)}
            </p>

            {/* Title */}
            <h2
              className="text-balance font-serif font-light leading-tight text-white transition-opacity group-hover:opacity-85"
              style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
            >
              {post.title}
            </h2>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="mt-5 line-clamp-3 text-sm leading-relaxed text-white/60">
                {post.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="mt-7 flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.25em] text-white/38">
              <span>{formattedDate}</span>
              <span aria-hidden>·</span>
              <span>{post.readMinutes} min read</span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
