export function ClosingCta() {
  return (
    <section id="visit" className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-4xl px-6 py-28 text-center lg:py-40">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.35em] text-primary-foreground/70">
          Begin
        </p>
        <h2 className="text-balance font-serif text-4xl font-light leading-[1.15] sm:text-5xl lg:text-6xl">
          Your time is the one thing you cannot make more of. Spend it well.
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-pretty text-lg font-light leading-relaxed text-primary-foreground/80">
          Reserve a visit to Brickwell in Seochon, and step into a slower, clearer
          way of living your days.
        </p>
        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
          <a
            href="#"
            className="inline-flex items-center justify-center rounded-full bg-background px-8 py-4 text-sm font-medium text-foreground transition-all duration-300 hover:scale-105"
          >
            Reserve your visit
          </a>
          <a
            href="#philosophy"
            className="text-sm font-medium text-primary-foreground/80 underline-offset-8 transition-colors hover:text-primary-foreground hover:underline"
          >
            Explore the philosophy
          </a>
        </div>
      </div>
    </section>
  )
}
