import { describe, expect, it } from "vitest"
import {
  addDaysToDateKey,
  formatDateKeyInKst,
  formatDisplayDate,
  formatKstDate,
  formatKstDateTime,
  formatKstMonthYear,
  formatTimeInKst,
} from "@/lib/time/kst"

/**
 * Every case here is an instant near midnight in Seoul, because that is the
 * only window where getting the timezone wrong is visible — and it is exactly
 * the window that shipped broken twice.
 *
 * These pass whatever the machine's own timezone is. That is the property
 * being tested: production runs on a UTC server, and until this module every
 * one of these read the server's clock instead of Seoul's.
 */

// 2026-08-12 08:00 KST. Stored as the 11th in UTC.
const MORNING = "2026-08-11T23:00:00+00:00"
// 2026-08-25 20:00 KST.
const EVENING = "2026-08-25T11:00:00+00:00"

describe("formatDateKeyInKst", () => {
  it("gives the Seoul calendar day, not the UTC one", () => {
    expect(formatDateKeyInKst(new Date(MORNING))).toBe("2026-08-12")
  })

  it("sorts, because that is what the key is for", () => {
    const days = ["2026-08-12", "2026-08-09", "2026-08-25"]
    expect([...days].sort()).toEqual(["2026-08-09", "2026-08-12", "2026-08-25"])
  })
})

describe("addDaysToDateKey", () => {
  it("crosses a month end", () => {
    expect(addDaysToDateKey("2026-08-31", 1)).toBe("2026-09-01")
  })

  it("goes backwards", () => {
    expect(addDaysToDateKey("2026-09-01", -1)).toBe("2026-08-31")
  })
})

describe("formatTimeInKst", () => {
  it("is the Seoul clock, on a 24-hour dial", () => {
    expect(formatTimeInKst(MORNING)).toBe("08:00")
    expect(formatTimeInKst(EVENING)).toBe("20:00")
  })
})

describe("formatDisplayDate", () => {
  it("spells out a date key with its weekday", () => {
    expect(formatDisplayDate("2026-08-25")).toBe("2026년 8월 25일 화")
  })
})

describe("formatKstDate", () => {
  it("reads the day in Seoul, not on the server", () => {
    // The bug this module exists for: with no timezone, a UTC server renders
    // this as 11 August — a journal post published on the 12th, dated the day
    // before, every morning.
    expect(formatKstDate(MORNING, { lang: "en" })).toBe("August 12, 2026")
    expect(formatKstDate(MORNING)).toBe("2026년 8월 12일")
  })

  it("abbreviates the month for a table column", () => {
    expect(formatKstDate(EVENING, { lang: "en", month: "short" })).toBe(
      "Aug 25, 2026",
    )
  })

  it("adds the weekday when someone has to turn up", () => {
    expect(formatKstDate(EVENING, { weekday: true })).toBe(
      "2026년 8월 25일 화",
    )
  })
})

describe("formatKstDateTime", () => {
  it("keeps the day and the clock in the same timezone", () => {
    // A roster line read at the door. Both halves have to be Seoul, or the
    // date says one thing and the time another.
    expect(formatKstDateTime(MORNING, { lang: "en" })).toBe(
      "Aug 12, 2026, 08:00 AM",
    )
  })
})

describe("formatKstMonthYear", () => {
  it("takes the month the instant falls in, in Seoul", () => {
    // 2026-09-01 00:30 KST is still August in UTC. An archive heading built
    // from the UTC month would file it under the wrong one.
    expect(formatKstMonthYear("2026-08-31T15:30:00+00:00")).toBe(
      "September 2026",
    )
  })
})
