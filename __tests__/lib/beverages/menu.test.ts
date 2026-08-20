import { describe, expect, it } from "vitest"
import {
  DEFAULT_BEVERAGE_ID,
  BEVERAGES,
  findBeverage,
  formatListPrice,
  receiptCode,
} from "@/lib/beverages/menu"
import { toPaypalAmount } from "@/lib/payments/money"

/**
 * The menu is the only place a counter price is written down, and there is no
 * database row behind it to catch a mistake. These are the things that would
 * charge someone the wrong amount or sell something that is not on sale.
 */

describe("the menu", () => {
  it("has the beverage the page opens on", () => {
    expect(findBeverage(DEFAULT_BEVERAGE_ID)).not.toBe(null)
  })

  it("prices everything in a currency PayPal can charge", () => {
    // Won is what the shop thinks in, and the one currency PayPal refuses. A
    // KRW price here would fail at createOrder, in front of a customer.
    for (const beverage of BEVERAGES) {
      expect(beverage.price.currency).toBe("USD")
    }
  })

  it("charges more than nothing", () => {
    for (const beverage of BEVERAGES) {
      expect(beverage.price.amount).toBeGreaterThan(0)
    }
  })

  it("gives every beverage its own id", () => {
    // findBeverage returns the first match, so a duplicate id would quietly
    // sell one beverage at another's price.
    expect(new Set(BEVERAGES.map((d) => d.id)).size).toBe(BEVERAGES.length)
  })

  it("prices land on a chargeable amount", () => {
    // A price of 4.999 would be sent to PayPal as "5.00" and shown on our own
    // page as $5.00, but the two agreeing is luck rather than design.
    for (const beverage of BEVERAGES) {
      expect(Number(toPaypalAmount(beverage.price))).toBe(beverage.price.amount)
    }
  })

  it("is nothing for an item that is not for sale", () => {
    expect(findBeverage("no-such-beverage")).toBe(null)
    expect(findBeverage("")).toBe(null)
  })

  it("has a sign price for everything", () => {
    // The counter picks by the won price. An item without one is an item a
    // barista cannot find on the sign in front of them.
    for (const beverage of BEVERAGES) {
      expect(beverage.listPriceKrw).toBeGreaterThan(0)
    }
  })

  it("charges within a few percent of the sign price", () => {
    // The dollars and the won are set by hand from a rate on a day, and drift
    // apart as the rate moves. This is the width at which someone should go
    // and reset them — not a conversion, a staleness alarm. Deliberately loose:
    // it must not fail because the market moved a little overnight.
    const RATE = 1391 // ₩/USD, 2026-08-20
    for (const beverage of BEVERAGES) {
      const impliedKrw = beverage.price.amount * RATE
      const drift = Math.abs(impliedKrw - beverage.listPriceKrw) / beverage.listPriceKrw
      expect(drift).toBeLessThan(0.05)
    }
  })

  it("gives every item its own sign price", () => {
    // Two buttons reading ₩5,000 is a barista guessing which one is which.
    expect(new Set(BEVERAGES.map((b) => b.listPriceKrw)).size).toBe(
      BEVERAGES.length,
    )
  })
})

describe("formatListPrice", () => {
  it("is the won price, no decimals", () => {
    expect(formatListPrice(BEVERAGES[0])).toBe("₩5,000")
    expect(formatListPrice(BEVERAGES[1])).toBe("₩8,000")
  })
})

describe("receiptCode", () => {
  it("takes the tail of the capture id", () => {
    // The head, not the tail, is what PayPal capture ids share. Two sales
    // whose codes look alike are two sales staff cannot tell apart.
    expect(receiptCode("5A7B9CDE1234FGHJ")).toBe("1234FGHJ")
  })

  it("uppercases it, because it gets read aloud", () => {
    expect(receiptCode("abcdefghij")).toBe("CDEFGHIJ")
  })

  it("survives an id shorter than the code", () => {
    expect(receiptCode("ab12")).toBe("AB12")
  })
})
