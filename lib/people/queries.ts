import { createClient } from "@/lib/supabase/server"
import type {
  PersonCardData,
  PersonKind,
  PersonProgramRow,
  PersonRow,
  PersonWithPrograms,
} from "./types"
import { PERSON_PROGRAM_COLUMNS, PERSON_PUBLIC_COLUMNS } from "./types"
import { modalitiesToPrograms, sortPeopleByName, toPersonCard } from "./utils"

function kindsForSection(section: "guide" | "artist"): PersonKind[] {
  return section === "guide" ? ["guide", "both"] : ["artist", "both"]
}

const PUBLIC_SELECT = `${PERSON_PUBLIC_COLUMNS}, person_programs (${PERSON_PROGRAM_COLUMNS})`

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
    .order("name_en", { ascending: true })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  const rows = data.map((row) => {
    const person = row as PersonRow & { person_programs?: PersonProgramRow[] }
    const programs = person.person_programs ?? []
    return toPersonCard(person, programs)
  })

  return rows.sort((a, b) => a.name.localeCompare(b.name, "en", { sensitivity: "base" }))
}

export async function getAllPeopleAdmin(): Promise<PersonWithPrograms[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("people")
    .select(`*, person_programs (${PERSON_PROGRAM_COLUMNS})`)
    .order("name_en", { ascending: true })
    .order("created_at", { ascending: false })

  if (error || !data) return []

  const mapped = data.map((row) => {
    const person = row as PersonRow & { person_programs?: PersonProgramRow[] }
    const programs = [...(person.person_programs ?? [])].sort(
      (a, b) => a.sort_order - b.sort_order,
    )
    return { ...person, programs }
  })

  return sortPeopleByName(mapped)
}

export async function getPersonById(id: string): Promise<PersonWithPrograms | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("people")
    .select(`*, person_programs (${PERSON_PROGRAM_COLUMNS})`)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) return null

  const row = data as PersonRow & { person_programs?: PersonProgramRow[] }
  const programs = [...(row.person_programs ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  )

  if (programs.length === 0 && row.modalities?.length > 0) {
    return {
      ...row,
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

  return { ...row, programs }
}
