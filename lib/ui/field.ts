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

/** App chrome — admin and partner dashboards. */
export const FIELD =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 sm:text-sm"

/** App chrome with the taller padding standalone auth forms use. */
export const FIELD_ROOMY =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 sm:text-sm"

/** Public booking and member forms — softer radius, primary focus ring. */
export const FIELD_PUBLIC =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-base text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20 sm:text-sm"
