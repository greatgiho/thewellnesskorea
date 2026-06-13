import Image from "next/image"
import { PATH_KEYWORDS } from "@/lib/paths/paths-data"

export function Philosophy() {
  return (
    <section id="philosophy" className="bg-background">
      {/* Opening manifesto */}
      <div className="mx-auto max-w-4xl px-6 py-28 text-center lg:py-40">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.35em] text-primary">
          Our Philosophy
        </p>
        <p className="text-balance font-serif text-3xl font-light leading-[1.3] text-foreground sm:text-4xl lg:text-[2.75rem]">
          Wellness is not something you visit. It is a time of restoration —
          emptying the mind, awakening the body, crafting with care, nourishing
          with good energy, and fully savoring the moment.
        </p>
      </div>

      {/* Editorial split */}
      <div className="mx-auto grid max-w-7xl items-stretch gap-0 px-6 pb-28 lg:grid-cols-2 lg:px-10 lg:pb-40">
        <div className="relative min-h-[420px] overflow-hidden rounded-tl-[40px] rounded-bl-[40px] lg:rounded-tr-none">
          <Image
            src="/kw-philosophy.png"
            alt="Soft natural light moving across a plaster wall in a calm Korean interior"
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center bg-secondary px-8 py-14 sm:px-14 lg:px-16">
          <h2 className="text-balance font-serif text-3xl font-light leading-tight text-foreground sm:text-4xl">
            One flow, from emptying to savoring.
          </h2>
          <div className="mt-7 space-y-5 text-base leading-relaxed text-muted-foreground">
            <p>
              We reinterpret the practices and aesthetics that have shaped Korean
              life for centuries — meditation, movement, the tea ceremony, seasonal
              food, and the living arts of gugak, dance, and performance — into a
              single rhythm of restoration.
            </p>
            <p>
              It begins by{" "}
              <span className="italic text-foreground">emptying</span> what weighs on
              the mind, <span className="italic text-foreground">awakening</span> the
              body, <span className="italic text-foreground">crafting</span> with
              mindful hands, <span className="italic text-foreground">nourishing</span>{" "}
              it with good energy, and finally{" "}
              <span className="italic text-foreground">savoring</span> the moment in
              full. Stillness and joy are two sides of the same breath.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-8 sm:grid-cols-3 lg:grid-cols-5">
            {PATH_KEYWORDS.map((item) => (
              <div key={item.label}>
                <p className="font-serif text-2xl text-primary sm:text-3xl">
                  {item.value}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-muted-foreground">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
