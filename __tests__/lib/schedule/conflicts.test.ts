import { describe, it, expect } from "vitest"
import {
  resolveSlotLane,
  type SessionConflictRow,
  type SlotResolverInput,
} from "@/lib/schedule/conflicts"
import { toKstIso } from "@/lib/schedule/utils"

const DATE = "2026-07-18"
const EXP = "exp-space"
const OTHER_EXP = "exp-other"

function row(
  over: Partial<SessionConflictRow> & {
    starts: string
    ends: string
  },
): SessionConflictRow {
  return {
    id: over.id ?? crypto.randomUUID(),
    experience_id: over.experience_id ?? EXP,
    floor_id: over.floor_id ?? "floor-1",
    is_all_floors: over.is_all_floors ?? false,
    instructor_id: over.instructor_id ?? "teacher-1",
    starts_at: toKstIso(DATE, over.starts),
    ends_at: toKstIso(DATE, over.ends),
    title: over.title ?? "Existing",
    status: over.status ?? "confirmed",
    slot_lane: over.slot_lane ?? 0,
  }
}

function input(over: Partial<SlotResolverInput> = {}): SlotResolverInput {
  return {
    floor_id: over.floor_id ?? "floor-1",
    instructor_id: over.instructor_id ?? "teacher-2",
    is_all_floors: over.is_all_floors ?? false,
    status: over.status ?? "processing",
  }
}

describe("resolveSlotLane — existing single-floor behaviour", () => {
  it("empty building: processing gets lane 0", () => {
    expect(resolveSlotLane(input(), EXP, []).slot_lane).toBe(0)
  })

  it("second processing on same floor gets lane 1", () => {
    const overlapping = [
      row({ floor_id: "floor-1", status: "processing", slot_lane: 0, starts: "10:00", ends: "11:00" }),
    ]
    expect(resolveSlotLane(input(), EXP, overlapping).slot_lane).toBe(1)
  })

  it("third competing processing on same floor is rejected", () => {
    const overlapping = [
      row({ floor_id: "floor-1", status: "processing", slot_lane: 0, starts: "10:00", ends: "11:00" }),
      row({ floor_id: "floor-1", status: "processing", slot_lane: 1, starts: "10:00", ends: "11:00" }),
    ]
    expect(() => resolveSlotLane(input(), EXP, overlapping)).toThrow(/Maximum 2/)
  })

  it("confirmed session on same floor blocks a new processing", () => {
    const overlapping = [
      row({ floor_id: "floor-1", status: "confirmed", starts: "10:00", ends: "11:00" }),
    ]
    expect(() => resolveSlotLane(input(), EXP, overlapping)).toThrow(/already confirmed/)
  })

  it("a different floor does not conflict", () => {
    const overlapping = [
      row({ floor_id: "floor-2", status: "confirmed", starts: "10:00", ends: "11:00" }),
    ]
    expect(resolveSlotLane(input({ floor_id: "floor-1" }), EXP, overlapping).slot_lane).toBe(0)
  })

  it("same instructor confirmed elsewhere is an instructor conflict", () => {
    const overlapping = [
      row({ floor_id: "floor-2", instructor_id: "teacher-2", status: "confirmed", starts: "10:00", ends: "11:00" }),
    ]
    expect(() =>
      resolveSlotLane(input({ floor_id: "floor-1", instructor_id: "teacher-2" }), EXP, overlapping),
    ).toThrow(/Instructor conflict/)
  })
})

describe("resolveSlotLane — all-floor rules", () => {
  it("all-floor placed on an empty building succeeds", () => {
    expect(resolveSlotLane(input({ is_all_floors: true }), EXP, []).slot_lane).toBe(0)
  })

  it("all-floor is blocked by ANY overlapping session in the same experience", () => {
    const overlapping = [
      row({ floor_id: "floor-3", status: "processing", starts: "10:00", ends: "11:00" }),
    ]
    expect(() =>
      resolveSlotLane(input({ is_all_floors: true }), EXP, overlapping),
    ).toThrow(/whole building free/)
  })

  it("all-floor ignores sessions in a different experience", () => {
    const overlapping = [
      row({ experience_id: OTHER_EXP, floor_id: "floor-9", status: "confirmed", starts: "10:00", ends: "11:00" }),
    ]
    expect(resolveSlotLane(input({ is_all_floors: true }), EXP, overlapping).slot_lane).toBe(0)
  })

  it("a normal session is blocked by an overlapping all-floor session", () => {
    const overlapping = [
      row({ floor_id: "floor-2", is_all_floors: true, status: "confirmed", starts: "10:00", ends: "11:00" }),
    ]
    expect(() =>
      resolveSlotLane(input({ floor_id: "floor-1" }), EXP, overlapping),
    ).toThrow(/held by an all-floor session/)
  })

  it("an overlapping PROCESSING all-floor also blocks a normal session", () => {
    const overlapping = [
      row({ floor_id: "floor-2", is_all_floors: true, status: "processing", starts: "10:00", ends: "11:00" }),
    ]
    expect(() =>
      resolveSlotLane(input({ floor_id: "floor-1" }), EXP, overlapping),
    ).toThrow(/held by an all-floor session/)
  })

  it("an all-floor session in a different experience does not block a normal session", () => {
    const overlapping = [
      row({ experience_id: OTHER_EXP, floor_id: "floor-9", is_all_floors: true, status: "confirmed", starts: "10:00", ends: "11:00" }),
    ]
    expect(resolveSlotLane(input({ floor_id: "floor-1" }), EXP, overlapping).slot_lane).toBe(0)
  })
})
