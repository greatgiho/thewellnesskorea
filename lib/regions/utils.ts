import type { PartnerActivityRegionRow, RegionRow } from "./types"

export function formatRegionLabel(
  sigungu: RegionRow,
  sido: RegionRow | undefined,
  locale: "ko" | "en" = "ko",
): string {
  const sidoName = sido
    ? locale === "ko"
      ? sido.name_ko
      : sido.name_en
    : ""
  const sigunguName = locale === "ko" ? sigungu.name_ko : sigungu.name_en
  if (!sidoName) return sigunguName
  return `${sidoName} · ${sigunguName}`
}

export function formatActivityRegionLabel(
  entry: PartnerActivityRegionRow,
  sidoByCode: Map<string, RegionRow>,
  locale: "ko" | "en" = "ko",
): string | null {
  const sigungu = entry.region
  if (!sigungu) return null
  const sido = sigungu.parent_code
    ? sidoByCode.get(sigungu.parent_code)
    : undefined
  return formatRegionLabel(sigungu, sido, locale)
}

export function primaryActivityRegion(
  regions: PartnerActivityRegionRow[] | undefined,
): PartnerActivityRegionRow | undefined {
  return regions?.find((r) => r.priority === 1)
}

export function secondaryActivityRegion(
  regions: PartnerActivityRegionRow[] | undefined,
): PartnerActivityRegionRow | undefined {
  return regions?.find((r) => r.priority === 2)
}

export function activityRegionCodesFromRows(
  regions: PartnerActivityRegionRow[] | undefined,
): { primary: string; secondary: string } {
  return {
    primary: primaryActivityRegion(regions)?.region_code ?? "",
    secondary: secondaryActivityRegion(regions)?.region_code ?? "",
  }
}
