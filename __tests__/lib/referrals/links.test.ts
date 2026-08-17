import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  formatSessionWhen,
  referralLink,
  sessionPath,
} from "@/lib/referrals/links"

/**
 * What these produce ends up printed on a card and stuck to a wall. A wrong
 * origin or a wrong date cannot be fixed by redeploying — someone has to go
 * and collect the paper.
 */
describe("referralLink", () => {
  const original = process.env.NEXT_PUBLIC_SITE_URL

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.thewellnesskorea.com"
  })
  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = original
  })

  it("points at the site, not at the deployment that drew it", () => {
    // deploymentOrigin() would put a preview host on the card. That URL stops
    // resolving once the branch is gone, long after anyone remembers which QR
    // came from where.
    expect(referralLink("cafe-tongui")).toBe(
      "https://www.thewellnesskorea.com/?ref=cafe-tongui",
    )
  })

  it("carries the code onto a class booking page", () => {
    expect(referralLink("cafe-tongui", "/book/abc-123")).toBe(
      "https://www.thewellnesskorea.com/book/abc-123?ref=cafe-tongui",
    )
  })

  it("keeps the referrer's own spelling", () => {
    // Matching is case-insensitive at the database, but the card should read
    // the way the partner was told their code reads.
    expect(referralLink("Cafe-Tongui")).toContain("ref=Cafe-Tongui")
  })
})

describe("sessionPath", () => {
  it("is the booking page for one class", () => {
    expect(sessionPath("7331875c-5d47-4ee4-9357-c7770ee87796")).toBe(
      "/book/7331875c-5d47-4ee4-9357-c7770ee87796",
    )
  })
})

describe("formatSessionWhen", () => {
  it("reads the date in KST, like the time", () => {
    // 08:00 KST on 12 August is 23:00 UTC on the 11th. Slicing the date off
    // the ISO string labelled every class before 09:00 KST with yesterday —
    // the bug fixed in #176, which would print the wrong day on a QR card.
    expect(formatSessionWhen("2026-08-11T23:00:00+00:00")).toBe(
      "2026년 8월 12일 수 08:00",
    )
  })

  it("is unchanged for a class in the middle of the day", () => {
    expect(formatSessionWhen("2026-08-22T10:00:00+00:00")).toBe(
      "2026년 8월 22일 토 19:00",
    )
  })
})
