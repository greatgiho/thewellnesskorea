import { createClient } from "@/lib/supabase/server"
import type {
  PersonCardData,
  PersonKind,
  PersonProgramRow,
  PersonRow,
  PersonWithPrograms,
} from "./types"
import { PERSON_PROGRAM_COLUMNS, PERSON_PUBLIC_COLUMNS } from "./types"
import {
  PERSON_ACTIVITY_REGIONS_SELECT,
} from "./types"
import type { PersonActivityRegionRow } from "@/lib/regions/types"
import {
  modalitiesToPrograms,
  sortPeopleByName,
  toPersonCard,
} from "./utils"
import { getRegionsForForms } from "@/lib/regions/queries"
import type { RegionRow } from "@/lib/regions/types"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"

function kindsForSection(section: "guide" | "artist"): PersonKind[] {
  return section === "guide" ? ["guide", "both"] : ["artist", "both"]
}

function normalizeActivityRegions(
  rows: PersonActivityRegionRow[] | undefined,
): PersonActivityRegionRow[] {
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

function attachProgramsAndRegions<T extends PersonRow & {
  person_programs?: PersonProgramRow[]
  person_activity_regions?: PersonActivityRegionRow[]
}>(
  row: T,
) {
  const programs = [...(row.person_programs ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )
  const activity_regions = normalizeActivityRegions(row.person_activity_regions)
  return { ...row, programs, activity_regions }
}

const PUBLIC_SELECT = `${PERSON_PUBLIC_COLUMNS}, person_programs (${PERSON_PROGRAM_COLUMNS}), ${PERSON_ACTIVITY_REGIONS_SELECT}`

export async function getPublishedPeople(
  section: "guide" | "artist",
): Promise<PersonCardData[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }
  const supabase = await createClient()
  const kinds = kindsForSection(section)

  const { data, error } = await supabase
    .from("people")
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
    const person = row as unknown as PersonRow & {
      person_programs?: PersonProgramRow[]
      person_activity_regions?: PersonActivityRegionRow[]
    }
    const programs = person.person_programs ?? []
    const activity_regions = normalizeActivityRegions(person.person_activity_regions)
    return toPersonCard(person, programs, activity_regions, sidoByCode)
  })

  return rows.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
}

export async function getPublishedPersonBySlug(
  slug: string,
): Promise<PersonWithPrograms | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("people")
    .select(`${PERSON_PUBLIC_COLUMNS}, person_programs (${PERSON_PROGRAM_COLUMNS}), ${PERSON_ACTIVITY_REGIONS_SELECT}`)
    .eq("slug", slug)
    .eq("is_published", true)
    .in("registration_status", ["admin", "approved"])
    .maybeSingle()

  if (error || !data) return null

  const row = data as unknown as PersonRow & {
    person_programs?: PersonProgramRow[]
    person_activity_regions?: PersonActivityRegionRow[]
  }
  const attached = attachProgramsAndRegions(row)
  const programs = attached.programs

  if (programs.length === 0 && row.modalities?.length > 0) {
    return {
      ...attached,
      programs: modalitiesToPrograms(row.modalities).map((p, i) => ({
        id: `legacy-${i}`,
        person_id: row.id,
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

export async function getAllPeopleAdmin(): Promise<PersonWithPrograms[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("people")
    .select(`*, person_programs (${PERSON_PROGRAM_COLUMNS}), ${PERSON_ACTIVITY_REGIONS_SELECT}`)
    .order("name_en", { ascending: true })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  const mapped = data.map((row) =>
    attachProgramsAndRegions(
      row as PersonRow & {
        person_programs?: PersonProgramRow[]
        person_activity_regions?: PersonActivityRegionRow[]
      },
    ),
  )

  return sortPeopleByName(mapped)
}

export async function getPersonById(id: string): Promise<PersonWithPrograms | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("people")
    .select(`*, person_programs (${PERSON_PROGRAM_COLUMNS}), ${PERSON_ACTIVITY_REGIONS_SELECT}`)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const row = data as PersonRow & {
    person_programs?: PersonProgramRow[]
    person_activity_regions?: PersonActivityRegionRow[]
  }
  const attached = attachProgramsAndRegions(row)
  const programs = attached.programs

  if (programs.length === 0 && row.modalities?.length > 0) {
    return {
      ...attached,
      programs: modalitiesToPrograms(row.modalities).map((p, i) => ({
        id: `legacy-${i}`,
        person_id: row.id,
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
