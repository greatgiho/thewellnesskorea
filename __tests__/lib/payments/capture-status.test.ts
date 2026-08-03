import { describe, expect, it } from "vitest"
import { captureOutcome } from "@/lib/payments/capture-status"

describe("captureOutcome", () => {
  it("confirms a completed capture", () => {
    expect(captureOutcome("COMPLETED")).toBe("confirm")
  })

  it("keeps waiting while the review is open", () => {
    // The seat stays held on purpose: the money is already taken, so releasing
    // would charge the customer and cancel their booking.
    expect(captureOutcome("PENDING")).toBe("wait")
  })

  it("releases the seat when the money never landed or went back", () => {
    expect(captureOutcome("DECLINED")).toBe("release")
    expect(captureOutcome("FAILED")).toBe("release")
    expect(captureOutcome("REFUNDED")).toBe("release")
  })

  it("waits on a status it does not model", () => {
    // Acting on a guess could confirm an unpaid booking or cancel a paid one.
    expect(captureOutcome("PARTIALLY_REFUNDED")).toBe("wait")
    expect(captureOutcome("SOMETHING_NEW")).toBe("wait")
    expect(captureOutcome(undefined)).toBe("wait")
  })
})
