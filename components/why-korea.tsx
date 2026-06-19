import Image from "next/image"

export function WhyKorea() {
  return (
    <section
      id="why-korea"
      className="relative h-svh w-full shrink-0 overflow-hidden lg:snap-start lg:snap-always"
    >
      <Image
        src="/kw-tea.png"
        alt="A celadon teacup and ceramic pot in soft warm light"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/45" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-16 pt-24 lg:px-12 lg:pb-24">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/70">
          Why Korean Wellness · Why Now
        </p>
        <h2 className="mt-5 max-w-3xl text-balance font-serif text-4xl font-light leading-tight text-white sm:text-5xl lg:text-6xl">
          A culture that has always known how to restore.
        </h2>
        <p className="mt-8 max-w-2xl text-pretty text-lg font-light leading-relaxed text-white/90 sm:text-xl">
          Long before wellness became a word, Korea lived its rhythm — emptying
          the mind through stillness, awakening the body through movement,
          nourishing through tea and seasonal food, and savoring through art and
          gathering.
        </p>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/75">
          Rooted in place. Sensory and whole. Made for today.
        </p>
      </div>
    </section>
  )
}
