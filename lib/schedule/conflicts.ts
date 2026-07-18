import { UserFacingError } from "@/lib/errors"
import { formatTimeInKst } from "@/lib/schedule/utils"
import type { SessionStatus } from "@/lib/schedule/types"

export type SessionConflictRow = {
  id: string
  experience_id: string
  floor_id: string
  is_all_floors: boolean
  instructor_id: string
  starts_at: string
  ends_at: string
  title: string
  status: SessionStatus
  slot_lane: number
}

export type SlotResolverInput = {
  floor_id: string
  instructor_id: string
  is_all_floors: boolean
  status: SessionStatus
}

function timeRange(row: SessionConflictRow): string {
  return `${formatTimeInKst(row.starts_at)}–${formatTimeInKst(row.ends_at)}`
}

function assignProcessingLane(processingInBucket: SessionConflictRow[]): number {
  const used = new Set(processingInBucket.map((s) => s.slot_lane))
  if (!used.has(0)) return 0
  if (!used.has(1)) return 1
  throw new UserFacingError("Maximum 2 competing sessions in this slot.")
}

function assertConfirmedOverlap(
  overlapping: SessionConflictRow[],
  input: SlotResolverInput,
) {
  for (const s of overlapping) {
    if (s.status !== "confirmed") continue
    if (s.floor_id === input.floor_id) {
      throw new UserFacingError(
        `Floor conflict: "${s.title}" overlaps (${timeRange(s)}).`,
      )
    }
    if (s.instructor_id === input.instructor_id) {
      throw new UserFacingError(
        `Instructor conflict: "${s.title}" overlaps (${timeRange(s)}).`,
      )
    }
  }
}

/**
 * Pure slot-conflict resolver. Given the sessions that overlap this one in time
 * (already fetched from the DB), decide whether the session may be placed and
 * which processing lane it takes. Throws UserFacingError on any conflict.
 *
 * All-floor rule: an all-floor session occupies every floor of its experience
 * for its time range, so it can only be placed when nothing else in the same
 * experience overlaps, and while it stands it blocks every floor.
 */
export function resolveSlotLane(
  input: SlotResolverInput,
  experienceId: string,
  overlapping: SessionConflictRow[],
): { slot_lane: number } {
  const sameBuilding = overlapping.filter(
    (s) => s.experience_id === experienceId,
  )

  if (input.is_all_floors) {
    const blocker = sameBuilding[0]
    if (blocker) {
      throw new UserFacingError(
        `All-floor session needs the whole building free. "${blocker.title}" overlaps (${timeRange(blocker)}).`,
      )
    }
    assertConfirmedOverlap(overlapping, input)
    return { slot_lane: 0 }
  }

  const allFloorBlocker = sameBuilding.find((s) => s.is_all_floors)
  if (allFloorBlocker) {
    throw new UserFacingError(
      `This slot is held by an all-floor session: "${allFloorBlocker.title}" (${timeRange(allFloorBlocker)}).`,
    )
  }

  const bucketOverlaps = overlapping.filter(
    (s) => s.floor_id === input.floor_id && !s.is_all_floors,
  )
  const hasConfirmedInBucket = bucketOverlaps.some(
    (s) => s.status === "confirmed",
  )

  if (input.status === "processing") {
    if (hasConfirmedInBucket) {
      throw new UserFacingError(
        "This slot is already confirmed. Add a processing session elsewhere.",
      )
    }
    const processingInBucket = bucketOverlaps.filter(
      (s) => s.status === "processing",
    )
    if (processingInBucket.length >= 2) {
      throw new UserFacingError("Maximum 2 competing sessions in this slot.")
    }
    assertConfirmedOverlap(overlapping, input)
    return { slot_lane: assignProcessingLane(processingInBucket) }
  }

  if (hasConfirmedInBucket) {
    throw new UserFacingError("This slot already has a confirmed session.")
  }
  const otherProcessing = bucketOverlaps.filter(
    (s) => s.status === "processing",
  )
  if (otherProcessing.length > 0) {
    throw new UserFacingError(
      "Resolve competing processing sessions with Confirm, or cancel them first.",
    )
  }
  assertConfirmedOverlap(overlapping, input)
  return { slot_lane: 0 }
}
