import { describe, it, expect } from "vitest"
import {
  decimalPlaces,
  formatMoney,
  money,
  paymentMode,
  roundMoney,
  toPaypalAmount,
  applyDiscount,
  basePriceFor,
  discountFrom,
  isDiscounted,
  orderListTotal,
  orderLines,
  partyListTotal,
  partySize,
  quoteOrder,
  quoteParty,
  tierSeatsLeft,
  type TierRate,
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

describe("applyDiscount", () => {
  const usd30 = money("USD", 30)
  const krw33000 = money("KRW", 33000)

  it("returns the price untouched when there is no discount", () => {
    const p = applyDiscount(usd30, null)
    expect(p.final.amount).toBe(30)
    expect(p.percentOff).toBe(0)
    expect(isDiscounted(p)).toBe(false)
  })

  it("takes a percentage off and rounds to the currency", () => {
    expect(applyDiscount(usd30, { type: "percent", value: 33 }).final.amount).toBe(20.1)
    expect(applyDiscount(krw33000, { type: "percent", value: 17 }).final.amount).toBe(27390)
  })

  it("takes a fixed amount off", () => {
    const p = applyDiscount(usd30, { type: "fixed", value: 5 })
    expect(p.final.amount).toBe(25)
    expect(p.percentOff).toBe(17)
  })

  it("labels a half-price class as 50% off", () => {
    // The example from the brief: ~~$50.00~~ $25.00 (50% off)
    const p = applyDiscount(money("USD", 50), { type: "fixed", value: 25 })
    expect(p.percentOff).toBe(50)
    expect(formatMoney(p.original)).toBe("$50.00")
    expect(formatMoney(p.final)).toBe("$25.00")
  })

  it("clamps at zero so an oversized fixed discount cannot go negative", () => {
    const p = applyDiscount(usd30, { type: "fixed", value: 999 })
    expect(p.final.amount).toBe(0)
    expect(p.percentOff).toBe(100)
    expect(paymentMode(p.final)).toBe("free")
  })

  it("turns a 100% discount into a free class", () => {
    const p = applyDiscount(usd30, { type: "percent", value: 100 })
    expect(p.final.amount).toBe(0)
    expect(paymentMode(p.final)).toBe("free")
  })
})

describe("discountFrom", () => {
  it("needs both columns to be set", () => {
    expect(discountFrom("percent", 20)).toEqual({ type: "percent", value: 20 })
    expect(discountFrom(null, 20)).toBeNull()
    expect(discountFrom("percent", null)).toBeNull()
    expect(discountFrom("percent", 0)).toBeNull()
  })

  it("ignores a type it does not recognise", () => {
    expect(discountFrom("half-off", 50)).toBeNull()
  })

  it("coerces PostgREST numeric strings", () => {
    expect(discountFrom("fixed", "12.50")).toEqual({ type: "fixed", value: 12.5 })
  })
})

describe("basePriceFor", () => {
  it("charges the child rate to a child", () => {
    expect(basePriceFor("KRW", 30000, 15000, "child")).toEqual({
      currency: "KRW",
      amount: 15000,
    })
  })

  it("leaves an adult on the adult rate even when a child rate exists", () => {
    expect(basePriceFor("KRW", 30000, 15000, "adult").amount).toBe(30000)
  })

  it("treats a zero child rate as free rather than absent", () => {
    // The distinction the null column exists for: 0 is a price, null is the
    // absence of one.
    expect(basePriceFor("KRW", 30000, 0, "child").amount).toBe(0)
  })

  it("falls back to the adult rate when the class has no child rate", () => {
    // The booking RPCs refuse a child ticket on such a class outright; this
    // only guards a screen asking what a child would pay.
    expect(basePriceFor("KRW", 30000, null, "child").amount).toBe(30000)
  })

  it("applies the session discount to whichever rate was chosen", () => {
    const discount = discountFrom("percent", 50)
    expect(
      applyDiscount(basePriceFor("KRW", 30000, 15000, "child"), discount).final
        .amount,
    ).toBe(7500)
  })
})

describe("quoteParty", () => {
  const KRW = (adults: number, children: number) =>
    quoteParty("KRW", 30000, 15000, null, { adults, children })

  it("charges each person at their own rate", () => {
    expect(KRW(2, 1).total.amount).toBe(75000)
    expect(KRW(2, 1).size).toBe(3)
  })

  it("is unchanged for the ordinary single booking", () => {
    expect(KRW(1, 0).total.amount).toBe(30000)
  })

  it("offers no child line when the class has no child rate", () => {
    const quote = quoteParty("KRW", 30000, null, null, { adults: 2, children: 0 })
    expect(quote.child).toBeNull()
  })

  it("discounts each rate before multiplying, not after", () => {
    // 50% off ₩30,000 and ₩15,000 is ₩15,000 and ₩7,500 per person. Two adults
    // and a child come to ₩37,500 — and each line item on screen must be the
    // per-person price, so the rounding has to happen per person.
    const quote = quoteParty("KRW", 30000, 15000, { type: "percent", value: 50 }, {
      adults: 2,
      children: 1,
    })
    expect(quote.adult.final.amount).toBe(15000)
    expect(quote.child?.final.amount).toBe(7500)
    expect(quote.total.amount).toBe(37500)
  })

  it("keeps the line items adding up when a rate rounds", () => {
    // 33% off $30.00 is $20.10 a head. Three of them is $60.30 — rounding the
    // total instead would let the receipt disagree with its own lines.
    const quote = quoteParty("USD", 30, null, { type: "percent", value: 33 }, {
      adults: 3,
      children: 0,
    })
    expect(quote.adult.final.amount).toBe(20.1)
    expect(quote.total.amount).toBe(60.3)
  })

  it("prices a party of children with no adult", () => {
    expect(KRW(0, 2).total.amount).toBe(30000)
  })
})

describe("partyListTotal", () => {
  it("ignores the session discount, which is what a coupon comes off", () => {
    const quote = quoteParty("KRW", 30000, 15000, { type: "percent", value: 50 }, {
      adults: 2,
      children: 1,
    })
    expect(quote.total.amount).toBe(37500)
    expect(partyListTotal(quote).amount).toBe(75000)
  })
})

describe("partySize", () => {
  it("counts everyone on the booking", () => {
    expect(partySize({ adults: 2, children: 3 })).toBe(5)
  })
})

describe("quoteOrder", () => {
  const R: TierRate = {
    id: "r", code: "R", name: null,
    priceAmount: 50000, childPriceAmount: 25000, capacity: 4, bookedCount: 1,
  }
  const S: TierRate = {
    id: "s", code: "S", name: null,
    priceAmount: 30000, childPriceAmount: 15000, capacity: 6, bookedCount: 0,
  }
  const A: TierRate = {
    id: "a", code: "A", name: null,
    priceAmount: 20000, childPriceAmount: null, capacity: 10, bookedCount: 0,
  }

  it("sums the lines across tiers", () => {
    // 2 R adults + 1 R child + 1 S adult
    const quote = quoteOrder("KRW", null, [R, S, A], [
      { tierId: "r", adults: 2, children: 1 },
      { tierId: "s", adults: 1, children: 0 },
    ])
    expect(quote.total.amount).toBe(155000)
    expect(quote.size).toBe(4)
  })

  it("keeps a line for every tier so the picker can show them all", () => {
    const quote = quoteOrder("KRW", null, [R, S, A], [
      { tierId: "r", adults: 1, children: 0 },
    ])
    expect(quote.lines).toHaveLength(3)
    expect(quote.lines.filter((l) => l.quote.size > 0)).toHaveLength(1)
  })

  it("sends only the tiers actually being bought", () => {
    const quote = quoteOrder("KRW", null, [R, S, A], [
      { tierId: "s", adults: 2, children: 0 },
    ])
    expect(orderLines(quote)).toEqual([
      { tierId: "s", adults: 2, children: 0 },
    ])
  })

  it("offers no child count on a tier with no child rate", () => {
    const quote = quoteOrder("KRW", null, [A], [{ tierId: "a", adults: 1, children: 0 }])
    expect(quote.lines[0].quote.child).toBeNull()
  })

  it("applies the session discount to every tier", () => {
    const quote = quoteOrder("KRW", { type: "percent", value: 50 }, [R, S], [
      { tierId: "r", adults: 1, children: 0 },
      { tierId: "s", adults: 1, children: 0 },
    ])
    expect(quote.total.amount).toBe(40000)
    // The coupon competes with that, so it needs the undiscounted figure.
    expect(orderListTotal(quote).amount).toBe(80000)
  })

  it("counts seats per tier, since selling out R does not free up S", () => {
    expect(tierSeatsLeft(R)).toBe(3)
    expect(tierSeatsLeft(S)).toBe(6)
  })

  it("prices a class with no tiers through the same path", () => {
    const single: TierRate = {
      id: null, code: "", name: null,
      priceAmount: 30000, childPriceAmount: null, capacity: 12, bookedCount: 0,
    }
    const quote = quoteOrder("KRW", null, [single], [
      { tierId: null, adults: 2, children: 0 },
    ])
    expect(quote.total.amount).toBe(60000)
  })
})
