import type { RegionsForForms } from "./types"

export function validateActivityRegionCodes(
  primaryCode: string,
  secondaryCode: string,
  regions: RegionsForForms,
): void {
  const primary = primaryCode.trim()
  const secondary = secondaryCode.trim()

  if (!primary) {
    throw new Error("Primary activity region is required.")
  }

  const sigunguCodes = new Set(regions.sigungu.map((row) => row.code))

  if (!sigunguCodes.has(primary)) {
    throw new Error("Select a valid primary activity region.")
  }

  if (secondary) {
    if (!sigunguCodes.has(secondary)) {
      throw new Error("Select a valid secondary activity region.")
    }
    if (secondary === primary) {
      throw new Error("Primary and secondary activity regions must differ.")
    }
  }
}
