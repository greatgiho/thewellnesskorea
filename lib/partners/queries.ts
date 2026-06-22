import { createClient } from "@/lib/supabase/server"
import type {
  PartnerCardData,
  PartnerKind,
  PartnerProgramRow,
  PartnerRow,
  PartnerWithPrograms,
} from "./types"
import { PARTNER_PROGRAM_COLUMNS, PARTNER_PUBLIC_COLUMNS } from "./types"
import {
  PARTNER_ACTIVITY_REGIONS_SELECT,
} from "./types"
import type { PartnerActivityRegionRow } from "@/lib/regions/types"
import {
  modalitiesToPrograms,
  sortPartnersByName,
  toPartnerCard,
} from "./utils"
import { getRegionsForForms } from "@/lib/regions/queries"
import type { RegionRow } from "@/lib/regions/types"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"

function kindsForSection(section: "guide" | "artist"): PartnerKind[] {
  return section === "guide" ? ["guide", "both"] : ["artist", "both"]
}

function normalizeActivityRegions(
  rows: PartnerActivityRegionRow[] | undefined,
): PartnerActivityRegionRow[] {
  if (!rows?.length) return []
  return [...rows]
    .sort((a, b) => a.priority - b.priority)
    .map((row) => ({
      ...row,
      region: normalizeRelation(
        row.region as RegionRow | RegionRow[] | null | undefined,
      ),
    }))
}

function attachProgramsAndRegions<T extends PartnerRow & {
  partner_programs?: PartnerProgramRow[]
  partner_activity_regions?: PartnerActivityRegionRow[]
}>(
  row: T,
) {
  const programs = [...(row.partner_programs ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )
  const activity_regions = normalizeActivityRegions(row.partner_activity_regions)
  return { ...row, programs, activity_regions }
}

const PUBLIC_SELECT = `${PARTNER_PUBLIC_COLUMNS}, partner_programs (${PARTNER_PROGRAM_COLUMNS}), ${PARTNER_ACTIVITY_REGIONS_SELECT}`

export async function getPublishedPartners(
  section: "guide" | "artist",
): Promise<PartnerCardData[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }
  const supabase = await createClient()
  const kinds = kindsForSection(section)

  const { data, error } = await supabase
    .from("partners")
    .select(PUBLIC_SELECT)
    .in("kind", kinds)
    .eq("is_published", true)
    .in("registration_status", ["admin", "approved"])
    .order("name_en", { ascending: true })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  const { sido } = await getRegionsForForms()
  const sidoByCode = new Map(sido.map((row: RegionRow) => [row.code, row]))

  const rows = data.map((row) => {
    const person = row as unknown as PartnerRow & {
      partner_programs?: PartnerProgramRow[]
      partner_activity_regions?: PartnerActivityRegionRow[]
    }
    const programs = person.partner_programs ?? []
    const activity_regions = normalizeActivityRegions(person.partner_activity_regions)
    return toPartnerCard(person, programs, activity_regions, sidoByCode)
  })

  return rows.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
}

export async function getPartnerBySlug(
  slug: string,
): Promise<PartnerWithPrograms | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("partners")
    .select(`${PARTNER_PUBLIC_COLUMNS}, partner_programs (${PARTNER_PROGRAM_COLUMNS}), ${PARTNER_ACTIVITY_REGIONS_SELECT}`)
    .eq("slug", slug)
    .eq("is_published", true)
    .in("registration_status", ["admin", "approved"])
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as PartnerRow & {
    partner_programs?: PartnerProgramRow[]
    partner_activity_regions?: PartnerActivityRegionRow[]
  }
  const attached = attachProgramsAndRegions(row)
  const programs = attached.programs

  if (programs.length === 0 && row.modalities?.length > 0) {
    return {
      ...attached,
      programs: modalitiesToPrograms(row.modalities).map((p, i) => ({
        id: `legacy-${i}`,
        partner_id: row.id,
        title: p.title,
        description: null,
        path_keys: p.path_keys,
        sort_order: i,
        created_at: row.created_at,
      })),
    }
  }

  return attached
}

export async function getAllPartnersAdmin(): Promise<PartnerWithPrograms[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("partners")
    .select(`*, partner_programs (${PARTNER_PROGRAM_COLUMNS}), ${PARTNER_ACTIVITY_REGIONS_SELECT}`)
    .order("name_en", { ascending: true })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  const mapped = data.map((row) =>
    attachProgramsAndRegions(
      row as PartnerRow & {
        partner_programs?: PartnerProgramRow[]
        partner_activity_regions?: PartnerActivityRegionRow[]
      },
    ),
  )

  return sortPartnersByName(mapped)
}

export async function getPartnerById(id: string): Promise<PartnerWithPrograms | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("partners")
    .select(`*, partner_programs (${PARTNER_PROGRAM_COLUMNS}), ${PARTNER_ACTIVITY_REGIONS_SELECT}`)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const row = data as PartnerRow & {
    partner_programs?: PartnerProgramRow[]
    partner_activity_regions?: PartnerActivityRegionRow[]
  }
  const attached = attachProgramsAndRegions(row)
  const programs = attached.programs

  if (programs.length === 0 && row.modalities?.length > 0) {
    return {
      ...attached,
      programs: modalitiesToPrograms(row.modalities).map((p, i) => ({
        id: `legacy-${i}`,
        partner_id: row.id,
        title: p.title,
        description: null,
        path_keys: p.path_keys,
        sort_order: i,
        created_at: row.created_at,
      })),
    }
  }

  return attached
}
