import { describe, expect, it } from "vitest"
import { money, onlineProviderFor, paymentMode, toTossAmount } from "@/lib/payments/money"

/**
 * Which processor takes which currency, and the switch that keeps adding Toss
 * from changing anything until someone means it.
 *
 * The `toss` argument is passed explicitly throughout rather than left to read
 * the environment: this is the rule that decides whether nine live KRW classes
 * are paid at the studio or online, and it should not be possible to flip it
 * by running the tests with a different .env.
 */
describe("onlineProviderFor", () => {
  it("sends dollars to PayPal, whatever Toss is doing", () => {
    expect(onlineProviderFor("USD", false)).toBe("paypal")
    expect(onlineProviderFor("USD", true)).toBe("paypal")
  })

  it("sends won to Toss, but only once it is configured", () => {
    expect(onlineProviderFor("KRW", true)).toBe("toss")
    // The whole point of the gate: no key, no change to how won is handled.
    expect(onlineProviderFor("KRW", false)).toBeNull()
  })
})

describe("paymentMode", () => {
  it("keeps won on-site until Toss is configured", () => {
    expect(paymentMode(money("KRW", 50000), false)).toBe("onsite")
    expect(paymentMode(money("KRW", 50000), true)).toBe("online")
  })

  it("leaves the dollar path exactly as it was", () => {
    expect(paymentMode(money("USD", 30), false)).toBe("online")
    expect(paymentMode(money("USD", 30), true)).toBe("online")
  })

  it("calls a free class free, whichever currency it is priced in", () => {
    // A 100% coupon lands here, and there is nothing for either processor to
    // charge — offering a payment window would be a dead end.
    expect(paymentMode(money("KRW", 0), true)).toBe("free")
    expect(paymentMode(money("USD", 0), true)).toBe("free")
  })
})

describe("toTossAmount", () => {
  it("is a whole number of won", () => {
    expect(toTossAmount(money("KRW", 50000))).toBe(50000)
  })

  it("snaps a discounted price to something chargeable", () => {
    // 33% off ₩50,000 is ₩33,500.00 in the abstract; won has no subunit, and
    // the amount is compared for equality on the way back from Toss.
    expect(toTossAmount(money("KRW", 33499.999999999996))).toBe(33500)
  })
})
