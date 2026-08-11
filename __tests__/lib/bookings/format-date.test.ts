import { describe, it, expect } from "vitest"
import { formatBookingDateTime } from "@/lib/bookings/format"

describe("formatBookingDateTime", () => {
  it("reads the date in KST, like the time", () => {
    // 08:00 KST on 12 August is 23:00 UTC on the 11th. Taking the date off the
    // ISO string put yesterday's date next to today's time — wrong on every
    // ticket and confirmation email for a class starting before 09:00 KST.
    const r = formatBookingDateTime(
      "2026-08-11T23:00:00+00:00",
      "2026-08-12T00:00:00+00:00",
    )
    expect(r.heading).toBe("Wednesday, August 12")
    expect(r.timeRange).toBe("08:00 – 09:00 (KST)")
  })

  it("is unchanged for a class in the middle of the day", () => {
    const r = formatBookingDateTime(
      "2026-08-12T05:00:00+00:00",
      "2026-08-12T06:00:00+00:00",
    )
    expect(r.heading).toBe("Wednesday, August 12")
    expect(r.timeRange).toBe("14:00 – 15:00 (KST)")
  })

  it("rolls to the next day at the other edge", () => {
    // 15:00 UTC is midnight KST — the date has to move forward, not back.
    const r = formatBookingDateTime(
      "2026-08-12T15:00:00+00:00",
      "2026-08-12T16:00:00+00:00",
    )
    expect(r.heading).toBe("Thursday, August 13")
    expect(r.timeRange).toBe("00:00 – 01:00 (KST)")
  })
})
