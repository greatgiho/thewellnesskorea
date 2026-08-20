import { describe, expect, it } from "vitest"
import { REFUND_STEPS, refundSummary, WITHDRAWAL_NOTICE } from "@/lib/legal/refund"

/**
 * The refund schedule is shown twice — in full on /refunds, and compressed
 * beside the pay button, where 전자상거래법 requires it. Two copies of a
 * refund schedule is how a customer ends up quoting the wrong one back, so
 * what matters here is that the short form is derived from the long one and
 * says the same thing.
 */

describe("the cancellation scale", () => {
  it("covers every step from ten days out to a no-show", () => {
    expect(REFUND_STEPS).toHaveLength(6)
    expect(REFUND_STEPS[0].refunded).toBe("결제금액 100%")
    expect(REFUND_STEPS[REFUND_STEPS.length - 1].refunded).toBe("환불 불가")
  })

  it("never refunds more the later you cancel", () => {
    // The one property that makes it a scale. A row out of order would be
    // read by a customer as the rule that applies to them.
    const kept = REFUND_STEPS.map((s) => Number(s.deducted.replace("%", "")))
    for (let i = 1; i < kept.length; i++) {
      expect(kept[i]).toBeGreaterThanOrEqual(kept[i - 1])
    }
  })

  it("gives every step a short form for the pay button", () => {
    for (const step of REFUND_STEPS) expect(step.short.trim()).not.toBe("")
  })
})

describe("refundSummary", () => {
  it("is built from the table, so it cannot drift from it", () => {
    const summary = refundSummary()
    for (const step of REFUND_STEPS) expect(summary).toContain(step.short)
  })

  it("says what it is", () => {
    expect(refundSummary()).toContain("취소 시 환불")
  })

  it("stays short enough to sit beside a button", () => {
    // It is a line under a form, not a page. If a step is added and this
    // fails, the summary needs rethinking rather than truncating.
    expect(refundSummary().length).toBeLessThan(120)
  })
})

describe("WITHDRAWAL_NOTICE", () => {
  it("states the seven days the law requires", () => {
    expect(WITHDRAWAL_NOTICE).toContain("7일")
  })

  it("says when it stops applying", () => {
    // 전자상거래법 제17조 제2항: once the service has begun, withdrawal is
    // limited. Omitting that half would promise something we cannot honour.
    expect(WITHDRAWAL_NOTICE).toContain("제공이 시작된")
  })
})
