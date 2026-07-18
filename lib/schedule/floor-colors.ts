// Floor color layers for the schedule views. Colors are keyed by floor level
// (1–4); all-floor sessions get their own pink swatch. Class strings are static
// literals so Tailwind keeps them through purge.

export type FloorSwatch = {
  dot: string
  text: string
  chipActive: string
}

const BY_LEVEL: Record<number, FloorSwatch> = {
  1: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
    chipActive: "border-emerald-500/50 bg-emerald-50/80 dark:bg-emerald-950/30",
  },
  2: {
    dot: "bg-sky-500",
    text: "text-sky-700 dark:text-sky-300",
    chipActive: "border-sky-500/50 bg-sky-50/80 dark:bg-sky-950/30",
  },
  3: {
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
    chipActive: "border-amber-500/50 bg-amber-50/80 dark:bg-amber-950/30",
  },
  4: {
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    chipActive: "border-violet-500/50 bg-violet-50/80 dark:bg-violet-950/30",
  },
}

export const ALL_FLOOR_SWATCH: FloorSwatch = {
  dot: "bg-pink-500",
  text: "text-pink-700 dark:text-pink-300",
  chipActive: "border-pink-500/50 bg-pink-50/80 dark:bg-pink-950/30",
}

export function floorSwatch(level: number): FloorSwatch {
  return BY_LEVEL[level] ?? BY_LEVEL[1]
}
