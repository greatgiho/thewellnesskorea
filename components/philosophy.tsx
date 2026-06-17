import Image from "next/image"

export function Philosophy() {
  return (
    <section
      id="philosophy"
      className="relative h-svh w-full shrink-0 snap-start snap-always overflow-hidden"
    >
      <Image
        src="/kw-philosophy.png"
        alt="Soft natural light moving across a plaster wall in a calm Korean interior"
        fill
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />

      <div className="relative flex h-full flex-col justify-end px-6 pb-16 pt-24 lg:px-12 lg:pb-24">
        <p className="font-mono text-xs uppercase tracking-[0.35em] text-white/70">
          Our Philosophy
        </p>
        <h2 className="mt-5 max-w-4xl text-balance font-serif text-4xl font-light leading-[1.15] text-white sm:text-5xl lg:text-6xl">
          Wellness is not something you visit. It is a time of restoration.
        </h2>
        <p className="mt-8 max-w-2xl text-pretty text-lg font-light leading-relaxed text-white/90 sm:text-xl">
          Emptying the mind, awakening the body, crafting with care, nourishing
          with good energy, and fully savoring the moment — one continuous rhythm
          from stillness to joy.
        </p>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/75">
          We reinterpret Korean meditation, movement, tea, seasonal food, and the
          living arts into a contemporary practice of living your time well.
        </p>
      </div>
    </section>
  )
}
