import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getPersonPhotoUrl } from "@/lib/people/utils"
import type { PersonKind } from "@/lib/people/types"
import { normalizeRelation } from "@/lib/supabase/normalize-relation"

export type JournalPartnerOption = {
  id: string
  slug: string
  name_en: string
  name_ko: string
  kind: PersonKind
  photo_path: string | null
  path_keys: string[]
}

export type JournalPartnerTag = {
  id: string
  slug: string
  name: string
  kind: PersonKind
  image: string
}

type PartnerRow = {
  id: string
  slug: string
  name_en: string
  name_ko: string
  kind: PersonKind
  photo_path: string | null
}

type JunctionRow = {
  sort_order: number
  person: PartnerRow | PartnerRow[] | null
}

function toPartnerTag(row: PartnerRow): JournalPartnerTag {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name_en,
    kind: row.kind,
    image: getPersonPhotoUrl(row.photo_path),
  }
}

export async function getJournalPartnerTagsForPost(
  postId: string,
): Promise<JournalPartnerTag[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("journal_post_people")
    .select(
      "sort_order, person:people (id, slug, name_en, name_ko, kind, photo_path)",
    )
    .eq("journal_post_id", postId)
    .order("sort_order", { ascending: true })

  if (error || !data?.length) return []

  return (data as JunctionRow[])
    .map((row) => normalizeRelation(row.person))
    .filter((person): person is PartnerRow => Boolean(person))
    .map(toPartnerTag)
}

export async function getJournalPartnerIdsForPostAdmin(
  postId: string,
): Promise<string[]> {
  const { supabase } = await requireAdminSession()
  const { data, error } = await supabase
    .from("journal_post_people")
    .select("person_id, sort_order")
    .eq("journal_post_id", postId)
    .order("sort_order", { ascending: true })

  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => row.person_id as string)
}

export async function getPartnerOptionsForJournalForm(): Promise<
  JournalPartnerOption[]
> {
  const { supabase } = await requireAdminSession()
  const { data, error } = await supabase
    .from("people")
    .select("id, slug, name_en, name_ko, kind, photo_path, person_programs (path_keys)")
    .in("registration_status", ["admin", "approved"])
    .order("name_en", { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((row) => {
    const programs = (row.person_programs ?? []) as { path_keys: string[] }[]
    const path_keys = [
      ...new Set(programs.flatMap((program) => program.path_keys ?? [])),
    ]
    return {
      id: row.id as string,
      slug: row.slug as string,
      name_en: row.name_en as string,
      name_ko: row.name_ko as string,
      kind: row.kind as PersonKind,
      photo_path: row.photo_path as string | null,
      path_keys,
    }
  })
}

export async function syncJournalPostPartners(
  supabase: SupabaseClient,
  postId: string,
  personIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("journal_post_people")
    .delete()
    .eq("journal_post_id", postId)

  if (deleteError) throw new Error(deleteError.message)

  const uniqueIds = [...new Set(personIds.filter(Boolean))]
  if (uniqueIds.length === 0) return

  const rows = uniqueIds.map((person_id, index) => ({
    journal_post_id: postId,
    person_id,
    sort_order: index,
  }))

  const { error: insertError } = await supabase
    .from("journal_post_people")
    .insert(rows)

  if (insertError) throw new Error(insertError.message)
}
