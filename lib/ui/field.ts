/**
 * Shared form-field classes.
 *
 * These strings were copy-pasted into 17 components, which meant a field
 * tweak had to be repeated 17 times — and in practice they had already
 * drifted (some carried `text-foreground`, some didn't).
 *
 * Every variant sets a 16px font below `sm`. iOS Safari force-zooms the page
 * when a focused input renders under 16px and never zooms back out, so the
 * mobile size is a correctness constraint, not a style choice. `sm:text-sm`
 * keeps the denser desktop size.
 */

/** Border, background, focus ring, and the mobile font size. No width. */
const CHROME =
  "rounded-lg border border-border bg-background text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 sm:text-sm"

/**
 * App chrome sized by the caller — for the few fields that set their own
 * width. Keep `w-full` out of it: Tailwind resolves same-specificity
 * conflicts by stylesheet order, not class order, so `cn(FIELD, "w-20")`
 * would not reliably beat `w-full`.
 */
export const FIELD_BASE = `${CHROME} px-3 py-2`

/** App chrome — admin and partner dashboards. */
export const FIELD = `w-full ${FIELD_BASE}`

/** App chrome with the taller padding standalone auth forms use. */
export const FIELD_ROOMY = `w-full ${CHROME} px-3 py-2.5`

/** Public booking and member forms — softer radius, primary focus ring. */
export const FIELD_PUBLIC =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 sm:text-sm"
