import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

/**
 * The shapes every redesign section restates.
 *
 * In the design original (design-reference/v0-original) each section spelled
 * these out inline, so the band padding, the heading scale, and the date badge
 * drifted apart by a few utility classes from one section to the next. They are
 * components here so that matching the original is a matter of using the right
 * one, not of copying a class string correctly.
 *
 * Nothing here holds state, so these stay server components: importing them
 * into a "use client" section does not pull them across the boundary.
 */

/**
 * A full-width band wrapping a centred column.
 *
 * `scroll-mt-20` keeps the heading clear of the fixed nav when the anchor links
 * jump here. Alternating `tone` between neighbouring sections is what gives the
 * page its banding — two `muted` sections in a row read as one long section.
 */
export function Section({
  id,
  tone = "plain",
  children,
}: {
  id: string
  tone?: "plain" | "muted"
  children: ReactNode
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 py-24 sm:py-32 ${
        tone === "muted" ? "bg-secondary/40" : "bg-background"
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">{children}</div>
    </section>
  )
}

/**
 * Eyebrow, heading, and optional lead paragraph.
 *
 * The eyebrow pairs Korean and English in one line ("지난 기록 · Past Events")
 * rather than switching with the language toggle. That is the original's
 * choice, and it is deliberate: the pairing is a visual motif, not a
 * translation.
 *
 * `action` places a control on the heading's baseline at desktop width. Give it
 * one only when it goes somewhere other than this section.
 */
export function SectionHeader({
  eyebrow,
  heading,
  lead,
  action,
}: {
  eyebrow?: ReactNode
  heading: ReactNode
  lead?: ReactNode
  action?: ReactNode
}) {
  const text = (
    <div className="max-w-2xl">
      {eyebrow && (
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--sage)]">
          {eyebrow}
        </p>
      )}
      <h2
        className={`font-serif text-4xl leading-tight text-foreground text-balance sm:text-5xl ${
          eyebrow ? "mt-4" : ""
        }`}
      >
        {heading}
      </h2>
      {lead && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
          {lead}
        </p>
      )}
    </div>
  )

  if (!action) return text

  return (
    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
      {text}
      {action}
    </div>
  )
}

/** The month-over-day block that opens a dated row. */
export function DateBadge({ month, day }: { month: string; day: string }) {
  return (
    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-lg bg-secondary text-center">
      <span className="text-xs uppercase tracking-widest text-[var(--sage)]">
        {month}
      </span>
      <span className="font-serif text-3xl text-foreground">{day}</span>
    </div>
  )
}

/** A category pill. */
export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground">
      {children}
    </span>
  )
}

/** A row of icon-and-text facts: when, where, how many seats. */
export function MetaList({
  className = "",
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground ${className}`}
    >
      {children}
    </div>
  )
}

export function MetaItem({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {children}
    </span>
  )
}
