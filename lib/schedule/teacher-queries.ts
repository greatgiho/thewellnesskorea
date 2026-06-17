import { createClient } from "@/lib/supabase/server"
import { SESSION_WITH_RELATIONS } from "@/lib/schedule/constants"
import { toSessionWithRelations } from "@/lib/schedule/queries"
import type { FloorRow, SessionRow, SessionWithRelations } from "@/lib/schedule/types"

export async function getUpcomingSessionsForTeacher(): Promise<
  SessionWithRelations[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: person, error: personError } = await supabase
    .from("people")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (personError) throw new Error(personError.message)
  if (!person) return []

  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("sessions")
    .select(SESSION_WITH_RELATIONS)
    .eq("instructor_id", person.id)
    .eq("status", "confirmed")
    .eq("is_published", true)
    .gte("starts_at", now)
    .order("starts_at", { ascending: true })

  if (error) throw new Error(error.message)
  if (!data) return []

  return data.map((row) =>
    toSessionWithRelations(
      row as SessionRow & {
        floor?: FloorRow | FloorRow[] | null
        instructor?:
          | SessionWithRelations["instructor"]
          | SessionWithRelations["instructor"][]
          | null
      },
    ),
  )
}
