import { describe, it, expect } from "vitest"
import {
  decimalPlaces,
  formatMoney,
  money,
  paymentMode,
  roundMoney,
  toPaypalAmount,
} from "@/lib/payments/money"

describe("decimalPlaces", () => {
  it("gives KRW no subunit and USD two", () => {
    expect(decimalPlaces("KRW")).toBe(0)
    expect(decimalPlaces("USD")).toBe(2)
  })
})

describe("roundMoney", () => {
  it("snaps KRW to whole won", () => {
    // 33% off ₩33,000 -> ₩10,890 exactly, but 17% off does not divide evenly
    expect(roundMoney(money("KRW", 10890)).amount).toBe(10890)
    expect(roundMoney(money("KRW", 27390.000000000004)).amount).toBe(27390)
    expect(roundMoney(money("KRW", 5610.5)).amount).toBe(5611)
  })

  it("snaps USD to cents", () => {
    // 33% off $30.00 = $9.90; the discounted price is $20.10
    expect(roundMoney(money("USD", 20.1)).amount).toBe(20.1)
    expect(roundMoney(money("USD", 9.899999999999999)).amount).toBe(9.9)
    expect(roundMoney(money("USD", 13.333333333333334)).amount).toBe(13.33)
  })

  it("rounds halves up rather than to even", () => {
    // Math.round already goes up on .5, but the binary representation of
    // these values is what breaks naive implementations.
    expect(roundMoney(money("USD", 1.005)).amount).toBe(1.01)
    expect(roundMoney(money("USD", 2.675)).amount).toBe(2.68)
    expect(roundMoney(money("KRW", 0.5)).amount).toBe(1)
  })

  it("leaves zero alone so a full discount stays free", () => {
    expect(roundMoney(money("USD", 0)).amount).toBe(0)
    expect(roundMoney(money("KRW", 0)).amount).toBe(0)
  })

  it("is idempotent — rounding an already-round amount changes nothing", () => {
    const once = roundMoney(money("USD", 13.333333333333334))
    expect(roundMoney(once).amount).toBe(once.amount)
  })
})

describe("rounded amounts survive the payment round trip", () => {
  it("formats and serialises the same value the charge uses", () => {
    // confirm_booking_payment rejects a capture whose amount differs from the
    // stored one, so the PayPal string must come from the same rounded Money.
    const charged = roundMoney(money("USD", 30 * 0.67))
    expect(charged.amount).toBe(20.1)
    expect(toPaypalAmount(charged)).toBe("20.10")
    expect(formatMoney(charged)).toBe("$20.10")
  })

  it("keeps a fully discounted class out of the online payment flow", () => {
    // A 100% discount lands on zero, which paymentMode reads as free — no
    // /book/pay step and no PayPal order.
    expect(paymentMode(roundMoney(money("USD", 0)))).toBe("free")
    expect(paymentMode(roundMoney(money("KRW", 0)))).toBe("free")
  })
})
