import { describe, it, expect } from "vitest"
import { formatParty } from "@/lib/bookings/format"

describe("formatParty", () => {
  it("reads as one line at the door", () => {
    expect(formatParty(2, 1)).toBe("2 adults · 1 child")
    expect(formatParty(1, 0)).toBe("1 adult")
    expect(formatParty(3, 2)).toBe("3 adults · 2 children")
  })

  it("omits a rate nobody on the booking is using", () => {
    // "2 adults · 0 children" is noise on a ticket someone reads in a doorway.
    expect(formatParty(2, 0)).toBe("2 adults")
    expect(formatParty(0, 1)).toBe("1 child")
  })
})
