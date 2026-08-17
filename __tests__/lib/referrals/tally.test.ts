import { describe, expect, it } from "vitest"
import {
  addMoney,
  talliesBySession,
  totalsByCode,
  type ReferralTally,
} from "@/lib/referrals/tally"

const tally = (over: Partial<ReferralTally>): ReferralTally => ({
  code: "cafe",
  sessionId: "s1",
  sessionTitle: "사운드 배스",
  sessionStartsAt: "2026-08-22T10:00:00+00:00",
  total: 0,
  confirmed: 0,
  lost: 0,
  revenue: [],
  ...over,
})

describe("addMoney", () => {
  it("keeps currencies apart", () => {
    // A partner who brought one KRW booking and one USD one is owed two lines,
    // not a number made of both.
    const into: { currency: string; amount: number }[] = []
    addMoney(into, "KRW", 30000)
    addMoney(into, "USD", 25)
    addMoney(into, "KRW", 30000)
    expect(into).toEqual([
      { currency: "KRW", amount: 60000 },
      { currency: "USD", amount: 25 },
    ])
  })
})

describe("totalsByCode", () => {
  it("adds one partner up across every class", () => {
    // This is the settlement line: what one person is owed, whatever it came
    // from. Getting it by summing the same rows the class cards show is what
    // stops the two screens disagreeing in front of the partner.
    const totals = totalsByCode([
      tally({ sessionId: "s1", total: 3, confirmed: 2, lost: 1, revenue: [{ currency: "KRW", amount: 60000 }] }),
      tally({ sessionId: "s2", total: 1, confirmed: 1, revenue: [{ currency: "KRW", amount: 30000 }] }),
      tally({ code: "insta", sessionId: "s1", total: 5, confirmed: 5 }),
    ])

    expect(totals.get("cafe")).toEqual({
      total: 4,
      confirmed: 3,
      lost: 1,
      revenue: [{ currency: "KRW", amount: 90000 }],
    })
    expect(totals.get("insta")?.confirmed).toBe(5)
  })

  it("is empty for a partner who brought nothing", () => {
    expect(totalsByCode([]).get("cafe")).toBeUndefined()
  })
})

describe("talliesBySession", () => {
  it("puts the biggest earner at the top of a class", () => {
    const grouped = talliesBySession([
      tally({ code: "small", confirmed: 1, total: 1 }),
      tally({ code: "big", confirmed: 4, total: 4 }),
      tally({ code: "middle", confirmed: 2, total: 9 }),
    ])
    expect(grouped.get("s1")?.map((t) => t.code)).toEqual([
      "big",
      "middle",
      "small",
    ])
  })

  it("ranks on confirmed, not on how many were started", () => {
    // A code with many cancelled bookings is not the one that sold. Sorting on
    // total would put a partner whose bookings all fell through above one whose
    // held — and the second is the one getting paid.
    const grouped = talliesBySession([
      tally({ code: "noisy", confirmed: 1, total: 20 }),
      tally({ code: "real", confirmed: 3, total: 3 }),
    ])
    expect(grouped.get("s1")?.[0].code).toBe("real")
  })

  it("drops a tally with no class rather than bucketing it under nothing", () => {
    const grouped = talliesBySession([tally({ sessionId: null, total: 1 })])
    expect(grouped.size).toBe(0)
  })
})
