import type { ExperienceKind } from "./types"

/** Frontend-fixed eyebrow lines (not stored as free-form DB text). */
export const EXPERIENCE_EYEBROW: Record<string, string> = {
  brickwell: "K-WELLNESS · Gyeongbokgung · Seochon · Seoul",
  "next-space": "K-WELLNESS · Next Space · Coming Soon",
}

export function experienceEyebrow(slug: string, kind: ExperienceKind): string {
  const fixed = EXPERIENCE_EYEBROW[slug]
  if (fixed) return fixed
  if (kind === "journey") {
    return "K-WELLNESS · Journey · Coming Soon"
  }
  return "K-WELLNESS · Space"
}

export function experienceKindLabel(kind: ExperienceKind): "Space" | "Journey" {
  return kind === "journey" ? "Journey" : "Space"
}
