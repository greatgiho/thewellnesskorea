import { createClient } from "@/lib/supabase/server"
import { getUpcomingSessions } from "@/lib/schedule/queries"
import type { SessionWithRelations } from "@/lib/schedule/types"

export async function getUpcomingSessionsForTeacher(): Promise<
  SessionWithRelations[]
> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  return getUpcomingSessions({ userId: user.id }, 0)
}
