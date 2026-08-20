import { describe, expect, it } from "vitest"
import {
  DEFAULT_BEVERAGE_ID,
  BEVERAGES,
  findBeverage,
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
