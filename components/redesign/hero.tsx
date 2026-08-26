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
 * Nothing behind it. There was a mugunghwa photograph under three layers of
 * scrim and a cream radial glow, all of which existed to stop it competing
 * with what sat on top — a background needing that much suppression is a
 * background nobody wanted. Brushwork wants paper.
 */
export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-svh w-full flex-col items-center justify-center bg-background px-6 text-center"
    >
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

      {/* Both lines at the same size. They are one lockup, and a large Korean
          line over a small English one reads as a headline with a caption
          under it — which puts the mark, the headline and the caption in three
          different weights on a screen that should have two things on it. */}
      <p className="mt-10 font-serif text-lg leading-tight text-foreground text-balance sm:mt-12 sm:text-2xl">
        한국인의 삶에서 웰니스를 만나다
      </p>
      <p className="mt-2 font-serif text-lg italic text-muted-foreground sm:text-2xl">
        Wellness, The Korean Way
      </p>

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
