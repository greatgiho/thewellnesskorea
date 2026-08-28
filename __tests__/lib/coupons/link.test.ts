import { describe, expect, it } from "vitest"
import {
  COUPON_PARAM,
  couponFromParam,
  couponLink,
  couponQuerySuffix,
  normalizeCouponCode,
} from "@/lib/coupons/link"

const SESSION = "17a8b364-3b98-412f-993f-0e2e234e25e5"

describe("normalizeCouponCode", () => {
  it("matches how the database stores a code", () => {
    // coupons_code_key indexes upper(btrim(code)), so these are one coupon.
    expect(normalizeCouponCode(" welcome20 ")).toBe("WELCOME20")
    expect(normalizeCouponCode("Welcome20")).toBe("WELCOME20")
  })
})

describe("couponLink", () => {
  it("points at the booking page with the code attached", () => {
    const link = couponLink(SESSION, "welcome20")
    const url = new URL(link)
    expect(url.pathname).toBe(`/book/${SESSION}`)
    expect(url.searchParams.get(COUPON_PARAM)).toBe("WELCOME20")
  })

  it("is absolute, because it gets pasted into a message", () => {
    expect(couponLink(SESSION, "A")).toMatch(/^https?:\/\//)
  })
})

describe("couponQuerySuffix", () => {
  it("appends onto any booking link", () => {
    const url = new URL(`https://example.com/book/${SESSION}${couponQuerySuffix("welcome20")}`)
    expect(url.searchParams.get(COUPON_PARAM)).toBe("WELCOME20")
  })

  it("escapes a code that would otherwise break the query", () => {
    // Nothing stops an admin typing this into the code field.
    const suffix = couponQuerySuffix("a&b=c")
    expect(suffix).not.toContain("&b=")
    const url = new URL(`https://example.com/book/x${suffix}`)
    expect(url.searchParams.get(COUPON_PARAM)).toBe("A&B=C")
  })
})

describe("couponFromParam", () => {
  it("reads and normalizes a code", () => {
    expect(couponFromParam("welcome20")).toBe("WELCOME20")
    expect(couponFromParam("  spaced  ")).toBe("SPACED")
  })

  it("is null when there is nothing usable", () => {
    expect(couponFromParam(undefined)).toBeNull()
    expect(couponFromParam("")).toBeNull()
    expect(couponFromParam("   ")).toBeNull()
    expect(couponFromParam([])).toBeNull()
  })

  it("takes the first of a repeated parameter", () => {
    // ?coupon=A&coupon=B — a box that holds one code has to pick one.
    expect(couponFromParam(["a", "b"])).toBe("A")
  })
})
