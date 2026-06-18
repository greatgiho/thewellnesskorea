import { createClient } from "@/lib/supabase/server"
import type { ExperienceRow } from "./types"
import { EXPERIENCE_PUBLIC_COLUMNS } from "./types"

export async function getPublishedExperiences(): Promise<ExperienceRow[]> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_PUBLIC_COLUMNS)
    .eq("is_published", true)
    .order("sort_order", { ascending: true })

  if (error || !data) return []
  return data as ExperienceRow[]
}

export async function getPublishedExperienceBySlug(
  slug: string,
): Promise<ExperienceRow | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("experiences")
    .select(EXPERIENCE_PUBLIC_COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle()

  if (error || !data) return null
  return data as ExperienceRow
}
