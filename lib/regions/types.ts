export type RegionRow = {
  code: string
  parent_code: string | null
  level: number
  name_ko: string
  name_en: string
  sort_order: number
}

export type PartnerActivityRegionRow = {
  priority: 1 | 2
  region_code: string
  region?: RegionRow | null
}

export type RegionsForForms = {
  sido: RegionRow[]
  sigungu: RegionRow[]
}
