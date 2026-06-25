/**
 * JournalCover — magazine-style cover, min-h-screen.
 * Server component: no interactivity needed.
 */
export function JournalCover() {
  return (
    <section className="relative flex min-h-screen flex-col justify-end overflow-hidden bg-background px-6 pb-20 pt-32 md:px-12">
      {/* Thin vertical rule — decorative */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/30"
      />

      {/* Large ghost number — decorative background */}
      <span
        aria-hidden
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 select-none font-serif leading-none text-border/20"
        style={{ fontSize: "clamp(8rem, 22vw, 18rem)", fontWeight: 300 }}
      >
        01
      </span>

      {/* Issue label */}
      <p className="relative mb-6 text-xs uppercase tracking-[0.4em] text-muted-foreground">
        Issue 01 &nbsp;·&nbsp; 2026
      </p>

      {/* Main title */}
      <h1
        className="relative max-w-2xl text-balance font-serif font-light leading-none tracking-tight text-foreground"
        style={{ fontSize: "clamp(3.5rem, 10vw, 8rem)" }}
      >
        Journal
      </h1>

      {/* Subtitle */}
      <p className="relative mt-8 max-w-md font-sans text-base font-light leading-relaxed text-muted-foreground sm:text-lg">
        Stories of philosophy, taste, space, and the slow pursuit of wellness
        from The Wellness Korea.
      </p>

      {/* Scroll cue */}
      <p
        aria-hidden
        className="absolute bottom-8 left-6 text-[0.6rem] uppercase tracking-[0.35em] text-muted-foreground/40 md:left-12"
      >
        Scroll to begin
      </p>
    </section>
  )
}
