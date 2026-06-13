import Image from "next/image"

export function WhyKorea() {
  return (
    <section id="why-korea" className="relative overflow-hidden">
      <Image
        src="/kw-tea.png"
        alt="A celadon teacup and ceramic pot in soft warm light"
        fill
        className="object-cover"
      />
      <div className="absolute inset-0 bg-foreground/65" />
      <div className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-44">
        <div className="max-w-2xl">
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.35em] text-background/80">
            Why Korean Wellness · Why Now
          </p>
          <h2 className="text-balance font-serif text-4xl font-light leading-tight text-background sm:text-5xl">
            A culture that has always known how to restore.
          </h2>
          <p className="mt-7 max-w-xl text-pretty text-lg font-light leading-relaxed text-background/85">
            Long before wellness became a word, Korea lived its rhythm — emptying
            the mind through stillness, awakening the body through movement,
            nourishing through tea and seasonal food, and savoring through art and
            gathering. We translate this inheritance for the present moment.
          </p>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-background/20 sm:grid-cols-3">
          {[
            {
              n: "01",
              title: "Rooted in place",
              body: "A rhythm shaped by Korean seasons, materials, and ways of gathering.",
            },
            {
              n: "02",
              title: "Sensory & whole",
              body: "Designed for the whole self — mind, body, energy, and the joy of being present.",
            },
            {
              n: "03",
              title: "Made for today",
              body: "Heritage translated into a refined, contemporary practice of restoration.",
            },
          ].map((item) => (
            <div
              key={item.n}
              className="bg-background/10 px-7 py-9 backdrop-blur-sm"
            >
              <p className="font-mono text-xs tracking-widest text-background/60">
                {item.n}
              </p>
              <h3 className="mt-4 font-serif text-2xl font-light text-background">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-background/80">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
