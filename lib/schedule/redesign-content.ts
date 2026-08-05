import { createClient } from "@/lib/supabase/server"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"
import { normalizeDescriptionBlocks } from "./images"
import { SESSION_SELECT } from "./constants"
import { kstDayRange, todayDateKeyInKst } from "./utils"
import type { FloorRow, SessionRow } from "./types"

// Query surface for the v0 redesign's Brickwell / PastEvents / Programs
// sections (see supabase/migrations/043_redesign_content_columns.sql).
//
// Deliberately NOT added to lib/schedule/constants.ts's SESSION_SELECT: that
// string is shared by the real schedule/booking flow. Selecting a column
// that doesn't exist yet (migration not applied) makes Supabase return an
// error, and every consumer of SESSION_SELECT swallows query errors by
// returning an empty result — so touching the shared select would silently
// blank out the live homepage's real Schedule/booking data before the
// migration lands. Keeping a separate select here means only these
// redesign-only queries go empty in the meantime, not the production ones.
const REDESIGN_SESSION_SELECT = `
  ${SESSION_SELECT},
  title_ko, content_category, blurb_en, blurb_ko, location_label_en, location_label_ko, is_bookable,
  floor:floors (id, slug, level, name_ko, name_en, sort_order)
`

export type ContentCategory = "day" | "night" | "exhibition"

export type RedesignSessionRow = SessionRow & {
  title_ko: string | null
  content_category: ContentCategory | null
  blurb_en: string | null
  blurb_ko: string | null
  location_label_en: string | null
  location_label_ko: string | null
  is_bookable: boolean
  floor?: FloorRow
}

function normalize(
  row: SessionRow & {
    title_ko: string | null
    content_category: ContentCategory | null
    blurb_en: string | null
    blurb_ko: string | null
    location_label_en: string | null
    location_label_ko: string | null
    is_bookable: boolean
    floor?: FloorRow | FloorRow[] | null
  },
): RedesignSessionRow {
  return {
    ...row,
    image_paths: row.image_paths ?? [],
    description_blocks: normalizeDescriptionBlocks(row.description_blocks),
    floor: normalizeRelation(row.floor),
  }
}

/** Upcoming sessions tagged with a Brickwell day/night/exhibition category. */
export async function getUpcomingCategorizedSessions(
  experienceId: string,
): Promise<RedesignSessionRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  const { start } = kstDayRange(todayDateKeyInKst())

  const { data, error } = await supabase
    .from("sessions")
    .select(REDESIGN_SESSION_SELECT)
    .eq("experience_id", experienceId)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .not("content_category", "is", null)
    .gte("starts_at", start)
    .order("starts_at", { ascending: true })

  if (error || !data) return []
  return data.map((row) => normalize(row as Parameters<typeof normalize>[0]))
}

/** Bookable (is_bookable = true) upcoming sessions, for the Programs grid. */
export async function getUpcomingBookableSessions(
  experienceId: string,
): Promise<RedesignSessionRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  const { start } = kstDayRange(todayDateKeyInKst())

  const { data, error } = await supabase
    .from("sessions")
    .select(REDESIGN_SESSION_SELECT)
    .eq("experience_id", experienceId)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .eq("is_bookable", true)
    .gte("starts_at", start)
    .order("starts_at", { ascending: true })

  if (error || !data) return []
  return data.map((row) => normalize(row as Parameters<typeof normalize>[0]))
}

/** Past sessions (already happened), most recent first, for PastEvents. */
export async function getPastSessions(
  experienceId: string,
  limit = 8,
): Promise<RedesignSessionRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  const { start } = kstDayRange(todayDateKeyInKst())

  const { data, error } = await supabase
    .from("sessions")
    .select(REDESIGN_SESSION_SELECT)
    .eq("experience_id", experienceId)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .lt("starts_at", start)
    .order("starts_at", { ascending: false })
    .limit(limit)

  if (error || !data) return []
  return data.map((row) => normalize(row as Parameters<typeof normalize>[0]))
}
