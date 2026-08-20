import { describe, expect, it } from "vitest"
import { beverageOrderLabels } from "@/lib/beverages/labels"

/**
 * Which counter rows get a clock in front of them.
 *
 * The cost of getting this wrong is a barista handing the wrong beverage over,
 * or refunding the wrong sale — both happen at the moment two rows read
 * the same. The other failure is quieter: putting a clock on every row turns a
 * queue into a log.
 */

// 2026-08-20 in KST. 09:06:12 and 09:07:44 are the same minute apart, on
// purpose: they must not collapse.
const at = (clock: string) => `2026-08-20T${clock}+09:00`

const order = (
  id: string,
  nickname: string | null,
  clock: string,
  extra: { payer?: { name?: string }; paypalCaptureId?: string } = {},
) => ({
  id,
  nickname,
  payer: extra.payer ?? {},
  paypalCaptureId: extra.paypalCaptureId ?? null,
  createdAt: at(clock),
})

describe("beverageOrderLabels", () => {
  it("is just the nickname when nothing clashes", () => {
    const labels = beverageOrderLabels([
      order("1", "태연", "09:06:12"),
      order("2", "윤아", "09:07:44"),
    ])
    expect(labels["1"]).toBe("태연")
    expect(labels["2"]).toBe("윤아")
  })

  it("puts the time on both when two share a name", () => {
    // Both, not just the second: the first is equally ambiguous once the
    // second exists, and labelling only one reads as a different kind of row.
    const labels = beverageOrderLabels([
      order("1", "태연", "09:06:12"),
      order("2", "태연", "09:31:05"),
    ])
    expect(labels["1"]).toBe("09:06:12 태연")
    expect(labels["2"]).toBe("09:31:05 태연")
  })

  it("leaves the others alone", () => {
    const labels = beverageOrderLabels([
      order("1", "태연", "09:06:12"),
      order("2", "윤아", "09:10:00"),
      order("3", "태연", "09:31:05"),
    ])
    expect(labels["2"]).toBe("윤아")
    expect(labels["1"]).toBe("09:06:12 태연")
    expect(labels["3"]).toBe("09:31:05 태연")
  })

  it("keeps seconds, so a minute apart is still two people", () => {
    // To the minute these would read identically, which is the whole failure
    // this is meant to prevent.
    const labels = beverageOrderLabels([
      order("1", "태연", "09:06:12"),
      order("2", "태연", "09:06:48"),
    ])
    expect(labels["1"]).toBe("09:06:12 태연")
    expect(labels["2"]).toBe("09:06:48 태연")
    expect(labels["1"]).not.toBe(labels["2"])
  })

  it("counts a name as clashing whatever case or padding it came in", () => {
    // Someone typed it twice by hand. "Mia" and "mia " is one person's name
    // written two ways, and a collision missed is worse than one flagged.
    const labels = beverageOrderLabels([
      order("1", "Mia", "09:06:12"),
      order("2", "mia ", "09:31:05"),
    ])
    expect(labels["1"]).toBe("09:06:12 Mia")
    // Trimmed on the way out too: the stray space was a typing accident, not
    // part of what anybody wants shouted across a counter.
    expect(labels["2"]).toBe("09:31:05 mia")
  })

  it("reads the clock in KST, not the machine's zone", () => {
    // The row is stored in UTC. 09:06 KST is 00:06 the same day in UTC, and a
    // counter in Seoul must not be told a beverage was rung up at midnight.
    const labels = beverageOrderLabels([
      { id: "1", nickname: "태연", createdAt: "2026-08-20T00:06:12+00:00" },
      { id: "2", nickname: "태연", createdAt: "2026-08-20T00:31:05+00:00" },
    ])
    expect(labels["1"]).toBe("09:06:12 태연")
    expect(labels["2"]).toBe("09:31:05 태연")
  })

  it("is empty for no orders", () => {
    expect(beverageOrderLabels([])).toEqual({})
  })
})

describe("falling back when nobody typed a nickname", () => {
  it("uses the name PayPal returned", () => {
    // The usual case now: the barista taps a price, and the account that pays
    // names itself.
    const labels = beverageOrderLabels([
      order("1", null, "09:06:12", { payer: { name: "Jiho Lee" } }),
    ])
    expect(labels["1"]).toBe("Jiho Lee")
  })

  it("prefers a typed nickname over PayPal's name", () => {
    // Somebody asked to be called this. That beats what the account says.
    const labels = beverageOrderLabels([
      order("1", "지호", "09:06:12", { payer: { name: "Jiho Lee" } }),
    ])
    expect(labels["1"]).toBe("지호")
  })

  it("falls back to the receipt code for a guest card payment", () => {
    // No account, no name typed. Eight characters is still something to call.
    const labels = beverageOrderLabels([
      order("1", null, "09:06:12", { paypalCaptureId: "5A7B9CDE1234FGHJ" }),
    ])
    expect(labels["1"]).toBe("1234FGHJ")
  })

  it("still has something to show before anything has been paid", () => {
    // A pending order has no capture and may have no name at all. It must not
    // render as a blank row.
    expect(beverageOrderLabels([order("1", null, "09:06:12")])["1"]).toBe("—")
  })

  it("clocks a clash between a nickname and a PayPal name", () => {
    // Two 지호s, one typed and one from an account, are still two people.
    const labels = beverageOrderLabels([
      order("1", "지호", "09:06:12"),
      order("2", null, "09:31:05", { payer: { name: "지호" } }),
    ])
    expect(labels["1"]).toBe("09:06:12 지호")
    expect(labels["2"]).toBe("09:31:05 지호")
  })
})
