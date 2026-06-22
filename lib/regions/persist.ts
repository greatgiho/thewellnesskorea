import type { SupabaseClient } from "@supabase/supabase-js"

export async function savePartnerActivityRegions(
  supabase: SupabaseClient,
  personId: string,
  primaryCode: string,
  secondaryCode: string,
) {
  const primary = primaryCode.trim()
  const secondary = secondaryCode.trim()

  const { error: deleteError } = await supabase
    .from("partner_activity_regions")
    .delete()
    .eq("partner_id", personId)

  if (deleteError) throw new Error(deleteError.message)

  const rows: { partner_id: string; priority: number; region_code: string }[] = []

  if (primary) {
    rows.push({ partner_id: personId, priority: 1, region_code: primary })
  }
  if (secondary) {
    rows.push({ partner_id: personId, priority: 2, region_code: secondary })
  }

  if (rows.length === 0) return

  const { error: insertError } = await supabase
    .from("partner_activity_regions")
    .insert(rows)

  if (insertError) throw new Error(insertError.message)
}
