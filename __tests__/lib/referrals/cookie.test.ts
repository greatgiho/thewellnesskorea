import { describe, expect, it } from "vitest"
import { normalizeReferralCode } from "@/lib/referrals/cookie"

/**
 * The code arrives in a URL anyone can type, and ends up in a cookie and then
 * in a database query. Everything downstream is written assuming this already
 * said no to anything odd.
 */
describe("normalizeReferralCode", () => {
  it("accepts what a partner would actually be given", () => {
    expect(normalizeReferralCode("cafe-tongui")).toBe("cafe-tongui")
    expect(normalizeReferralCode("JIN_2026")).toBe("JIN_2026")
    // Trimmed, because a code copied off a card brings whitespace with it.
    expect(normalizeReferralCode("  cafe-tongui  ")).toBe("cafe-tongui")
  })

  it("rejects anything that is not a code", () => {
    expect(normalizeReferralCode(null)).toBeNull()
    expect(normalizeReferralCode("")).toBeNull()
    expect(normalizeReferralCode("   ")).toBeNull()
    // One character is too short to be meant, 33 is past what the column takes.
    expect(normalizeReferralCode("a")).toBeNull()
    expect(normalizeReferralCode("a".repeat(33))).toBeNull()
  })

  it("rejects characters that would mean something elsewhere", () => {
    // A code goes into a URL, a cookie, and an ilike pattern. Spaces and
    // separators are the ones that change meaning on the way.
    expect(normalizeReferralCode("bad code")).toBeNull()
    expect(normalizeReferralCode("a;b")).toBeNull()
    expect(normalizeReferralCode("a/b")).toBeNull()
    // % and _ are ilike wildcards. _ is allowed in a code and safe here
    // because the value is passed as a parameter, not interpolated; % is not
    // in the allowed set at all.
    expect(normalizeReferralCode("a%b")).toBeNull()
    expect(normalizeReferralCode("a_b")).toBe("a_b")
  })

  it("keeps the visitor's capitalisation for the caller to resolve", () => {
    // Matching is case-insensitive at the database, which is where the
    // referrer's own spelling is read back. Lowercasing here would throw away
    // what was typed before anything had a chance to compare it.
    expect(normalizeReferralCode("Cafe-Tongui")).toBe("Cafe-Tongui")
  })
})
