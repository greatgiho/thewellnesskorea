import { describe, expect, it } from "vitest"
import { sanitizeSearch, searchFilter, SEARCH_COLUMNS } from "@/lib/beverages/search"

/**
 * The filter string goes into PostgREST's `or`, which is a raw grammar rather
 * than a bound parameter. So the two things worth checking are that a search
 * looks everywhere a customer could be named, and that nothing anyone types
 * can change what the filter means.
 */

describe("searchFilter", () => {
  it("looks in every column a customer could name themselves by", () => {
    const filter = searchFilter("jiho") as string
    for (const column of SEARCH_COLUMNS) {
      expect(filter).toContain(`${column}.ilike.%jiho%`)
    }
  })

  it("finds a sale by the code on the receipt", () => {
    // The most precise thing somebody can read off their own phone.
    expect(searchFilter("1234FGHJ")).toContain("paypal_capture_id.ilike.%1234FGHJ%")
  })

  it("is nothing for a blank search", () => {
    // Not an empty filter — `or()` with nothing in it would match every row,
    // which is the opposite of what an empty box should do.
    expect(searchFilter("")).toBe(null)
    expect(searchFilter("   ")).toBe(null)
  })

  it("is nothing when a search is only punctuation", () => {
    // Same failure by a longer route: strip the meaningful characters out and
    // an unguarded version would build `col.ilike.%%` and return the lot.
    expect(searchFilter("%%")).toBe(null)
    expect(searchFilter("(),")).toBe(null)
  })
})

describe("sanitizeSearch", () => {
  it("drops the characters that separate and group filter terms", () => {
    // "Lee, Jiho" would otherwise be read as two filters, the second nonsense.
    expect(sanitizeSearch("Lee, Jiho")).toBe("Lee Jiho")
    expect(sanitizeSearch("(Jiho)")).toBe("Jiho")
  })

  it("drops the LIKE wildcards", () => {
    // A customer called %% must not match everybody.
    expect(sanitizeSearch("%jiho%")).toBe("jiho")
    expect(sanitizeSearch("ji_ho")).toBe("jiho")
    expect(sanitizeSearch("ji\\ho")).toBe("jiho")
  })

  it("leaves an ordinary name, email or code alone", () => {
    expect(sanitizeSearch("태연")).toBe("태연")
    expect(sanitizeSearch("jiho@example.com")).toBe("jiho@example.com")
    expect(sanitizeSearch("1234FGHJ")).toBe("1234FGHJ")
    expect(sanitizeSearch("  Jiho Lee  ")).toBe("Jiho Lee")
  })
})
