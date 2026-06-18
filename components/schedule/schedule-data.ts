import type { PathKey } from "@/lib/paths/paths-data"

export const pathAccent: Record<PathKey, string> = {
  bium: "bg-[oklch(0.9_0.02_120)] text-primary",
  kkaeum: "bg-[oklch(0.88_0.04_145)] text-primary",
  jieum: "bg-[oklch(0.9_0.03_90)] text-[oklch(0.45_0.05_70)]",
  chaeum: "bg-[oklch(0.9_0.025_60)] text-[oklch(0.45_0.06_55)]",
  nurim: "bg-secondary text-primary",
}

export function pathAccentClass(pathKey: PathKey | null): string {
  if (pathKey && pathAccent[pathKey]) return pathAccent[pathKey]
  return "bg-secondary text-primary"
}
