import type { createClient } from "@/lib/supabase/server"
import { UserFacingError } from "@/lib/errors"
import type { SessionFormInput } from "@/lib/schedule/types"
import { formatTimeInKst, kstDayRange, sessionsOverlap } from "@/lib/schedule/utils"
import { resolveSlotLane, type SessionConflictRow } from "@/lib/schedule/conflicts"

/**
 * Placing a session in the room: which experience the floor belongs to, what
 * else overlaps it, and which lane it lands in — plus cancelling the tentative
 * sessions it displaces when one is confirmed.
 */

export async function resolveExperienceIdForFloor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  floorId: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("floors")
    .select("experience_id")
    .eq("id", floorId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data?.experience_id) {
    throw new Error("Selected floor is missing an experience. Check Floors in the database.")
  }

  return data.experience_id as string
}

export async function fetchOverlappingSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
  excludeId?: string,
): Promise<SessionConflictRow[]> {
  const { start, end } = kstDayRange(input.date)

  // Fetch every non-cancelled session in the day. All-floor sessions can
  // conflict across floors, so we can't pre-filter by floor_id here; the
  // day-scoped set is tiny, so we resolve conflicts in memory below.
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, experience_id, floor_id, is_all_floors, instructor_id, starts_at, ends_at, title, status, slot_lane",
    )
    .gte("starts_at", start)
    .lt("starts_at", end)
    .neq("status", "cancelled")

  if (error) throw new Error(error.message)

  return (data ?? []).filter((row) => {
    if (excludeId && row.id === excludeId) return false
    return sessionsOverlap(starts_at, ends_at, row.starts_at, row.ends_at)
  }) as SessionConflictRow[]
}

export async function resolveSessionSlot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SessionFormInput,
  experienceId: string,
  starts_at: string,
  ends_at: string,
  excludeId?: string,
): Promise<{ slot_lane: number }> {
  const overlapping = await fetchOverlappingSessions(
    supabase,
    input,
    starts_at,
    ends_at,
    excludeId,
  )
  return resolveSlotLane(input, experienceId, overlapping)
}

export async function cancelCompetingProcessing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  winnerId: string,
  scope: { isAllFloors: boolean; floorId: string; experienceId: string },
  starts_at: string,
  ends_at: string,
  cancelledBy: string,
): Promise<number> {
  const date = starts_at.slice(0, 10)
  const { start, end } = kstDayRange(date)

  // A confirmed all-floor winner clears competing processing sessions on every
  // floor of its experience; a normal winner only clears its own floor.
  let query = supabase
    .from("sessions")
    .select("id, starts_at, ends_at")
    .eq("status", "processing")
    .neq("id", winnerId)
    .gte("starts_at", start)
    .lt("starts_at", end)

  query = scope.isAllFloors
    ? query.eq("experience_id", scope.experienceId)
    : query.eq("floor_id", scope.floorId)

  const { data, error } = await query

  if (error) throw new Error(error.message)

  const losers = (data ?? []).filter((s) =>
    sessionsOverlap(starts_at, ends_at, s.starts_at, s.ends_at),
  )
  if (losers.length === 0) return 0

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: cancelledBy,
      cancel_reason: "competition_lost",
    })
    .in(
      "id",
      losers.map((s) => s.id),
    )

  if (updateError) throw new Error(updateError.message)

  // TODO: notify each cancelled session's created_by

  return losers.length
}
