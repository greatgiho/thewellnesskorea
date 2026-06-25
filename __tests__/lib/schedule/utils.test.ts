import { describe, it, expect } from "vitest"
import {
  sessionsOverlap,
  isWithinOperatingHours,
  toKstIso,
  addDaysToDateKey,
  startOfWeekDateKey,
  endOfWeekDateKey,
  defaultEndTime,
} from "@/lib/schedule/utils"

describe("sessionsOverlap", () => {
  const base = "2026-07-01"

  it("overlap: B starts during A", () => {
    expect(
      sessionsOverlap(
        toKstIso(base, "10:00"),
        toKstIso(base, "11:00"),
        toKstIso(base, "10:30"),
        toKstIso(base, "11:30"),
      ),
    ).toBe(true)
  })

  it("no overlap: B starts exactly when A ends", () => {
    expect(
      sessionsOverlap(
        toKstIso(base, "10:00"),
        toKstIso(base, "11:00"),
        toKstIso(base, "11:00"),
        toKstIso(base, "12:00"),
      ),
    ).toBe(false)
  })

  it("no overlap: B is entirely after A", () => {
    expect(
      sessionsOverlap(
        toKstIso(base, "10:00"),
        toKstIso(base, "11:00"),
        toKstIso(base, "13:00"),
        toKstIso(base, "14:00"),
      ),
    ).toBe(false)
  })

  it("overlap: A fully contains B", () => {
    expect(
      sessionsOverlap(
        toKstIso(base, "09:00"),
        toKstIso(base, "12:00"),
        toKstIso(base, "10:00"),
        toKstIso(base, "11:00"),
      ),
    ).toBe(true)
  })

  it("overlap: identical times", () => {
    expect(
      sessionsOverlap(
        toKstIso(base, "10:00"),
        toKstIso(base, "11:00"),
        toKstIso(base, "10:00"),
        toKstIso(base, "11:00"),
      ),
    ).toBe(true)
  })
})

describe("isWithinOperatingHours", () => {
  const date = "2026-07-01"

  it("valid: 10:00–11:00", () => {
    expect(isWithinOperatingHours(date, "10:00", "11:00")).toBe(true)
  })

  it("valid: 06:00–24:00 (full day)", () => {
    expect(isWithinOperatingHours(date, "06:00", "24:00")).toBe(true)
  })

  it("invalid: end before start", () => {
    expect(isWithinOperatingHours(date, "11:00", "10:00")).toBe(false)
  })

  it("invalid: before operating start (05:00)", () => {
    expect(isWithinOperatingHours(date, "05:00", "06:00")).toBe(false)
  })

  it("invalid: beyond midnight (24:30)", () => {
    expect(isWithinOperatingHours(date, "23:00", "24:30")).toBe(false)
  })

  it("invalid: same time", () => {
    expect(isWithinOperatingHours(date, "10:00", "10:00")).toBe(false)
  })
})

describe("addDaysToDateKey", () => {
  it("adds 1 day", () => {
    expect(addDaysToDateKey("2026-01-31", 1)).toBe("2026-02-01")
  })

  it("adds 0 days (noop)", () => {
    expect(addDaysToDateKey("2026-07-01", 0)).toBe("2026-07-01")
  })

  it("subtracts days with negative", () => {
    expect(addDaysToDateKey("2026-03-01", -1)).toBe("2026-02-28")
  })

  it("handles year boundary", () => {
    expect(addDaysToDateKey("2025-12-31", 1)).toBe("2026-01-01")
  })
})

describe("startOfWeekDateKey / endOfWeekDateKey", () => {
  it("Monday is start of its own week", () => {
    expect(startOfWeekDateKey("2026-06-29")).toBe("2026-06-29") // Monday
  })

  it("Sunday belongs to previous week", () => {
    expect(startOfWeekDateKey("2026-06-28")).toBe("2026-06-22") // Sun → Mon of prev week
  })

  it("end of week is Sunday", () => {
    expect(endOfWeekDateKey("2026-06-29")).toBe("2026-07-05")
  })
})

describe("defaultEndTime", () => {
  it("adds 60 minutes by default", () => {
    expect(defaultEndTime("10:00")).toBe("11:00")
  })

  it("adds custom duration", () => {
    expect(defaultEndTime("10:00", 90)).toBe("11:30")
  })

  it("handles hour boundary", () => {
    expect(defaultEndTime("10:30", 60)).toBe("11:30")
  })
})
