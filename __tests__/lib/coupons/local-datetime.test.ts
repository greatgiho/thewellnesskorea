import { describe, expect, it } from "vitest"
import { fromLocalInput, toLocalInput } from "@/lib/coupons/local-datetime"

describe("fromLocalInput", () => {
  it("reads the value as the reader's wall clock, not as UTC", () => {
    const iso = fromLocalInput("2026-08-28T13:27")
    // Whatever zone this runs in, the instant must be the one whose local
    // clock reads 13:27 — which is what the old .slice() approach got wrong.
    const back = new Date(iso!)
    expect(back.getHours()).toBe(13)
    expect(back.getMinutes()).toBe(27)
  })

  it("is null for nothing", () => {
    expect(fromLocalInput(null)).toBeNull()
    expect(fromLocalInput("")).toBeNull()
    expect(fromLocalInput("not a date")).toBeNull()
  })
})

describe("toLocalInput", () => {
  it("round-trips a value from the form", () => {
    expect(toLocalInput(fromLocalInput("2026-08-28T13:27"))).toBe("2026-08-28T13:27")
  })

  it("shows an instant on the reader's own clock", () => {
    const at = new Date(2026, 7, 28, 13, 27)
    expect(toLocalInput(at.toISOString())).toBe("2026-08-28T13:27")
  })

  it("is empty for nothing", () => {
    expect(toLocalInput(null)).toBe("")
    expect(toLocalInput("")).toBe("")
    expect(toLocalInput("nonsense")).toBe("")
  })
})
