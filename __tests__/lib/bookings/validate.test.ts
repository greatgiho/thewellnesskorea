import { describe, it, expect } from "vitest"
import { validateGuestBookingInput } from "@/lib/bookings/validate"

describe("validateGuestBookingInput", () => {
  const valid = {
    guestName: "Kim Ji Eun",
    guestEmail: "ji@example.com",
    guestPhone: "+82 10 1234 5678",
  }

  it("accepts valid input", () => {
    expect(() => validateGuestBookingInput(valid)).not.toThrow()
  })

  it("throws when name is empty", () => {
    expect(() =>
      validateGuestBookingInput({ ...valid, guestName: "" }),
    ).toThrow("Please enter your name.")
  })

  it("throws when name is whitespace only", () => {
    expect(() =>
      validateGuestBookingInput({ ...valid, guestName: "   " }),
    ).toThrow("Please enter your name.")
  })

  it("throws when email is empty", () => {
    expect(() =>
      validateGuestBookingInput({ ...valid, guestEmail: "" }),
    ).toThrow("Please enter your email.")
  })

  it("throws when email is invalid", () => {
    expect(() =>
      validateGuestBookingInput({ ...valid, guestEmail: "notanemail" }),
    ).toThrow("Please enter a valid email address.")
  })

  it("accepts null phone (optional)", () => {
    expect(() =>
      validateGuestBookingInput({ ...valid, guestPhone: null }),
    ).not.toThrow()
  })

  it("accepts undefined phone (optional)", () => {
    expect(() =>
      validateGuestBookingInput({ guestName: valid.guestName, guestEmail: valid.guestEmail }),
    ).not.toThrow()
  })
})
