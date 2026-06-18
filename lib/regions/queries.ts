import { createClient } from "@/lib/supabase/server"
import koreaRegions from "./korea-regions.json"
import type { RegionRow, RegionsForForms } from "./types"

function jsonToRegionRows(): RegionsForForms {
  return {
    sido: koreaRegions.sido.map((row) => ({
      code: row.code,
      parent_code: row.parentCode,
      level: row.level,
      name_ko: row.nameKo,
      name_en: row.nameEn,
      sort_order: row.sortOrder,
    })),
    sigungu: koreaRegions.sigungu.map((row) => ({
      code: row.code,
      parent_code: row.parentCode,
      level: row.level,
      name_ko: row.nameKo,
      name_en: row.nameEn,
      sort_order: row.sortOrder,
    })),
  }
}

export async function getRegionsForForms(): Promise<RegionsForForms> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return jsonToRegionRows()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("regions")
    .select("code, parent_code, level, name_ko, name_en, sort_order")
    .order("sort_order", { ascending: true })

  if (error || !data?.length) {
    return jsonToRegionRows()
  }

  const rows = data as RegionRow[]
  return {
    sido: rows.filter((row) => row.level === 1),
    sigungu: rows.filter((row) => row.level === 2),
  }
}
