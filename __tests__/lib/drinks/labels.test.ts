import { describe, expect, it } from "vitest"
import { drinkOrderLabels } from "@/lib/drinks/labels"

/**
 * Which counter rows get a clock in front of them.
 *
 * The cost of getting this wrong is a barista handing the wrong drink over, or
 * refunding the wrong sale — both of which happen at the moment two rows read
 * the same. The other failure is quieter: putting a clock on every row turns a
 * queue into a log.
 */

// 2026-08-20 in KST. 09:06:12 and 09:07:44 are the same minute apart, on
// purpose: they must not collapse.
const at = (clock: string) => `2026-08-20T${clock}+09:00`

const order = (id: string, nickname: string, clock: string) => ({
  id,
  nickname,
  createdAt: at(clock),
})

describe("drinkOrderLabels", () => {
  it("is just the nickname when nothing clashes", () => {
    const labels = drinkOrderLabels([
      order("1", "태연", "09:06:12"),
      order("2", "윤아", "09:07:44"),
    ])
    expect(labels["1"]).toBe("태연")
    expect(labels["2"]).toBe("윤아")
  })

  it("puts the time on both when two share a name", () => {
    // Both, not just the second: the first is equally ambiguous once the
    // second exists, and labelling only one reads as a different kind of row.
    const labels = drinkOrderLabels([
      order("1", "태연", "09:06:12"),
      order("2", "태연", "09:31:05"),
    ])
    expect(labels["1"]).toBe("09:06:12 태연")
    expect(labels["2"]).toBe("09:31:05 태연")
  })

  it("leaves the others alone", () => {
    const labels = drinkOrderLabels([
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
    const labels = drinkOrderLabels([
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
    const labels = drinkOrderLabels([
      order("1", "Mia", "09:06:12"),
      order("2", "mia ", "09:31:05"),
    ])
    expect(labels["1"]).toBe("09:06:12 Mia")
    expect(labels["2"]).toBe("09:31:05 mia ")
  })

  it("reads the clock in KST, not the machine's zone", () => {
    // The row is stored in UTC. 09:06 KST is 00:06 the same day in UTC, and a
    // counter in Seoul must not be told a drink was rung up at midnight.
    const labels = drinkOrderLabels([
      { id: "1", nickname: "태연", createdAt: "2026-08-20T00:06:12+00:00" },
      { id: "2", nickname: "태연", createdAt: "2026-08-20T00:31:05+00:00" },
    ])
    expect(labels["1"]).toBe("09:06:12 태연")
    expect(labels["2"]).toBe("09:31:05 태연")
  })

  it("is empty for no orders", () => {
    expect(drinkOrderLabels([])).toEqual({})
  })
})
