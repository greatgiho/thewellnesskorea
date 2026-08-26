import Image from "next/image"
import { ArrowDown } from "lucide-react"

/**
 * The first screen: the mark, and what this place is.
 *
 * What was here before was a drawing surface — a brush cursor, a canvas, and
 * an invitation to draw what wellness felt like to you, with the words fading
 * out once you did. It was charming and it was in the way. The first screen of
 * a site that sells classes has one job, and asking a visitor to make something
 * before telling them what they have arrived at is not it.
 *
 * So: the logo, and the line under it. Nothing to operate.
 *
 * Both languages at once rather than following the toggle. The two lines are
 * one lockup — the Korean says it and the English says it again for whoever
 * cannot read the first — and a hero that shows half of it depending on a
 * setting is showing half a logo. It is also why this is a server component
 * now, where the canvas needed three hundred lines of client state.
 *
 * The photograph behind stays. It is already at 45% under a cream radial glow,
 * so what actually sits behind the mark is close to flat paper with some warmth
 * at the edges — which is the background the logo was drawn for.
 */
export function Hero() {
  return (
    <section id="top" className="relative min-h-svh w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/images/mugunghwa-hero-wide.png"
          alt=""
          fill
          priority
          className="scale-110 object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background" />
        {/* Keeps the blossoms from competing with the mark. */}
        <div className="absolute inset-0 [background:radial-gradient(60%_55%_at_50%_45%,var(--background)_0%,color-mix(in_oklch,var(--background)_55%,transparent)_45%,transparent_75%)]" />
      </div>

      <div className="relative flex min-h-svh flex-col items-center justify-center px-6 text-center">
        {/* Not `fill` — the mark has its own proportions and a fixed box would
            crop or letterbox them. Width is set, height follows. */}
        <Image
          src="/brand/logo-brush.png"
          alt="The Wellness Korea"
          width={900}
          height={1016}
          priority
          className="h-auto w-52 sm:w-64"
        />

        <p className="mt-10 font-serif text-3xl leading-tight text-foreground text-balance sm:mt-12 sm:text-5xl">
          한국인의 삶에서 웰니스를 만나다
        </p>
        <p className="mt-4 font-serif text-lg italic text-muted-foreground sm:text-2xl">
          Wellness, The Korean Way
        </p>
      </div>

      <a
        href="#philosophy"
        className="absolute inset-x-0 bottom-6 mx-auto flex w-fit flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Scroll to explore"
      >
        <span className="text-xs uppercase tracking-widest">둘러보기 · Explore</span>
        <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
      </a>
    </section>
  )
}
