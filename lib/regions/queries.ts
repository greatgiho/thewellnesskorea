import { createClient } from "@/lib/supabase/server"
import type { RegionRow, RegionsForForms } from "./types"

/**
 * The nationwide region list, from the database.
 *
 * There used to be a bundled JSON copy to fall back on. It never fired —
 * prod, dev, and local all carry the same 269 seeded rows — but while it
 * existed, an environment missing the seed would quietly serve a second copy
 * of the list instead of saying so. Regions drive partner activity areas, so
 * a missing seed is worth a failed page rather than a silent substitution.
 */
export async function getRegionsForForms(): Promise<RegionsForForms> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("regions")
    .select("code, parent_code, level, name_ko, name_en, sort_order")
    .order("sort_order", { ascending: true })

  if (error) throw new Error(`Could not read regions: ${error.message}`)
  if (!data?.length) {
    throw new Error(
      "The regions table is empty. Apply supabase/migrations/010_regions_seed.sql.",
    )
  }

  const rows = data as RegionRow[]
  return {
    sido: rows.filter((row) => row.level === 1),
    sigungu: rows.filter((row) => row.level === 2),
  }
}
