import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * A list that scrolls sideways on a phone and goes back to a grid above it.
 *
 * Five paths stacked vertically is five screens of scrolling to learn there
 * were five of them; the same is true of the roster. Sideways, they are one
 * screen and a swipe.
 *
 * The reason this is not just `overflow-x-auto` is the peek. A row of cards
 * that ends exactly at the screen edge looks like a row that ended, so each
 * card is a little narrower than the viewport and the next one's edge stays
 * visible — that sliver is the only thing telling anyone to swipe. It is also
 * the answer to the objection that put this section on a grid in the first
 * place (people.tsx): a scroller hides the rest of the list, unless it visibly
 * doesn't.
 *
 * Item sizing lives here, as child selectors, rather than on the `li`s in the
 * three callers. The bleed, the snap positions and the card width have to agree
 * with each other to land on the padding, and splitting them across files is
 * how they stop agreeing.
 */
export function PeekRow({
  cols,
  className,
  children,
}: {
  /** Grid columns from `sm:` up, e.g. "sm:grid-cols-2 lg:grid-cols-4". */
  cols: string
  className?: string
  children: ReactNode
}) {
  return (
    <ul
      className={cn(
        // Phone: a scroller that runs to both screen edges. -mx-6 cancels the
        // Section's gutter so cards can bleed; px-6 puts the first card back on
        // the text's left edge; scroll-px-6 makes the snap land there too.
        "hide-scrollbar -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain scroll-px-6 px-6",
        "[&>li]:min-w-0 [&>li]:shrink-0 [&>li]:basis-[82%] [&>li]:snap-start",
        // A lone card has nothing to peek at, and 82% of the screen with a gap
        // to nowhere just looks like a mistake.
        "[&>li:only-child]:basis-full",
        // sm and up: the grid this always was, untouched.
        "sm:mx-0 sm:grid sm:snap-none sm:gap-6 sm:overflow-visible sm:px-0",
        "sm:[&>li]:basis-auto",
        cols,
        className,
      )}
    >
      {children}
    </ul>
  )
}
