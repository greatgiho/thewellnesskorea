import { describe, expect, it } from "vitest"
import {
  DEFAULT_DRINK_ID,
  DRINKS,
  drinkReference,
  findDrink,
  receiptCode,
} from "@/lib/drinks/menu"
import { toPaypalAmount } from "@/lib/payments/money"

/**
 * The menu is the only place a counter price is written down, and there is no
 * database row behind it to catch a mistake. These are the things that would
 * charge someone the wrong amount or sell something that is not on sale.
 */

describe("the menu", () => {
  it("has the drink the page opens on", () => {
    expect(findDrink(DEFAULT_DRINK_ID)).not.toBe(null)
  })

  it("prices everything in a currency PayPal can charge", () => {
    // Won is what the shop thinks in, and the one currency PayPal refuses. A
    // KRW price here would fail at createOrder, in front of a customer.
    for (const drink of DRINKS) {
      expect(drink.price.currency).toBe("USD")
    }
  })

  it("charges more than nothing", () => {
    for (const drink of DRINKS) {
      expect(drink.price.amount).toBeGreaterThan(0)
    }
  })

  it("gives every drink its own id", () => {
    // findDrink returns the first match, so a duplicate id would quietly sell
    // one drink at another's price.
    expect(new Set(DRINKS.map((d) => d.id)).size).toBe(DRINKS.length)
  })

  it("prices land on a chargeable amount", () => {
    // A price of 4.999 would be sent to PayPal as "5.00" and shown on our own
    // page as $5.00, but the two agreeing is luck rather than design.
    for (const drink of DRINKS) {
      expect(Number(toPaypalAmount(drink.price))).toBe(drink.price.amount)
    }
  })

  it("is nothing for an item that is not for sale", () => {
    expect(findDrink("no-such-drink")).toBe(null)
    expect(findDrink("")).toBe(null)
  })
})

describe("drinkReference", () => {
  it("names the item, since PayPal is the only record of the sale", () => {
    expect(drinkReference(DRINKS[0])).toBe(`drink:${DRINKS[0].id}`)
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
