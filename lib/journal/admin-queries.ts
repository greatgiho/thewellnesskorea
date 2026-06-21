import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { JOURNAL_PUBLIC_COLUMNS, type JournalPostRow } from "./types"

export async function getAllJournalPostsAdmin(): Promise<JournalPostRow[]> {
  const { supabase } = await requireAdminSession()
  const { data, error } = await supabase
    .from("journal_posts")
    .select(JOURNAL_PUBLIC_COLUMNS)
    .order("published_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as JournalPostRow[]
}

export async function getJournalPostByIdAdmin(
  id: string,
): Promise<JournalPostRow | null> {
  const { supabase } = await requireAdminSession()
  const { data, error } = await supabase
    .from("journal_posts")
    .select(JOURNAL_PUBLIC_COLUMNS)
    .eq("id", id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return (data as JournalPostRow | null) ?? null
}

export async function getPublishedExperiencesForJournalForm(): Promise<
  { id: string; name_en: string; kind: string }[]
> {
  const { supabase } = await requireAdminSession()
  const { data, error } = await supabase
    .from("experiences")
    .select("id, name_en, kind")
    .eq("is_published", true)
    .order("sort_order")

  if (error) throw new Error(error.message)
  return data ?? []
}
