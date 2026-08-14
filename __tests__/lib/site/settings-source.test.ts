import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BusinessInfo, SiteSettings } from "@/lib/site/settings"
import { EMPTY_BUSINESS_INFO, EMPTY_SITE_INFO } from "@/lib/site/settings"

/**
 * The fallback chain, and the one rule that can take production down.
 *
 * Worth pinning tightly: every branch here is either "the site serves details
 * it should not" or "the site refuses to serve at all", and both are found in
 * production or not at all.
 */

const dbSettings = vi.hoisted(() => ({ current: null as SiteSettings | null }))

vi.mock("@/lib/site/settings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/site/settings")>()
  return {
    ...actual,
    getSiteSettings: async () => dbSettings.current ?? actual.EMPTY_SITE_SETTINGS,
  }
})

const {
  PLACEHOLDER_BUSINESS_INFO,
  missingRequired,
  mustBlockPublicSite,
  resolveSiteSettings,
} = await import("@/lib/site/settings-source")

const FULL_BUSINESS: BusinessInfo = {
  businessName: "더 웰니스 코리아",
  representativeName: "김대표",
  businessNumber: "123-45-67890",
  mailOrderNumber: "제2026-서울종로-0001호",
  address: "서울 종로구 통의동 1",
  phone: "02-1234-5678",
  email: "hello@example.com",
  privacyOfficer: "김책임",
}

const FULL_SITE = {
  taglineEn: "Tagline",
  taglineKo: "소개",
  visitAddressEn: "Address",
  visitAddressKo: "주소",
  contactEmail: "hello@example.com",
}

const envJson = (settings: Partial<Record<string, string>>) =>
  JSON.stringify(settings)

beforeEach(() => {
  dbSettings.current = null
  delete process.env.SITE_SETTINGS_FALLBACK
  delete process.env.VERCEL_ENV
})

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("resolveSiteSettings", () => {
  it("prefers the database", async () => {
    dbSettings.current = { site: FULL_SITE, business: FULL_BUSINESS }
    process.env.SITE_SETTINGS_FALLBACK = envJson({
      business_name: "from env",
      representative_name: "x",
      business_number: "x",
      address: "x",
      phone: "x",
      email: "x",
    })

    const resolved = await resolveSiteSettings()
    expect(resolved.businessSource).toBe("database")
    expect(resolved.business.businessName).toBe("더 웰니스 코리아")
  })

  it("falls to the environment when the database is short a required field", async () => {
    dbSettings.current = {
      site: FULL_SITE,
      // Everything but the phone number: partly filled is not a smaller kind of
      // compliant, it is a page that looks right and is not.
      business: { ...FULL_BUSINESS, phone: "" },
    }
    process.env.SITE_SETTINGS_FALLBACK = envJson({
      business_name: "환경변수 상호",
      representative_name: "대표",
      business_number: "111-11-11111",
      address: "주소",
      phone: "02-0000-0000",
      email: "env@example.com",
    })

    const resolved = await resolveSiteSettings()
    expect(resolved.businessSource).toBe("env")
    expect(resolved.business.businessName).toBe("환경변수 상호")
    expect(resolved.missingInDatabase).toEqual(["phone"])
  })

  it("falls to the placeholders when neither has it", async () => {
    const resolved = await resolveSiteSettings()
    expect(resolved.businessSource).toBe("placeholder")
    expect(resolved.business).toEqual(PLACEHOLDER_BUSINESS_INFO)
  })

  it("ignores an environment fallback that is also short a field", async () => {
    process.env.SITE_SETTINGS_FALLBACK = envJson({ business_name: "상호만" })
    const resolved = await resolveSiteSettings()
    expect(resolved.businessSource).toBe("placeholder")
  })

  it("reports malformed JSON instead of throwing", async () => {
    process.env.SITE_SETTINGS_FALLBACK = "{ not json"
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})

    const resolved = await resolveSiteSettings()
    expect(resolved.envError).toBeTruthy()
    expect(resolved.businessSource).toBe("placeholder")
    spy.mockRestore()
  })

  it("resolves the two blocks independently", async () => {
    // Prose cleared on purpose, trader details filled: clearing a tagline must
    // not push the registration number onto a fallback.
    dbSettings.current = { site: EMPTY_SITE_INFO, business: FULL_BUSINESS }
    const resolved = await resolveSiteSettings()
    expect(resolved.businessSource).toBe("database")
    expect(resolved.siteSource).toBe("placeholder")
  })
})

describe("mustBlockPublicSite", () => {
  const resolved = (businessSource: "database" | "env" | "placeholder") => ({
    site: EMPTY_SITE_INFO,
    business: EMPTY_BUSINESS_INFO,
    siteSource: "database" as const,
    businessSource,
    missingInDatabase: [],
    envError: null,
  })

  it("blocks production when nothing in the chain had the details", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    expect(mustBlockPublicSite(resolved("placeholder"))).toBe(true)
  })

  it("leaves production alone once the fallback is carrying it", () => {
    vi.stubEnv("VERCEL_ENV", "production")
    expect(mustBlockPublicSite(resolved("env"))).toBe(false)
    expect(mustBlockPublicSite(resolved("database"))).toBe(false)
  })

  it("never blocks a preview or a local run", () => {
    vi.stubEnv("VERCEL_ENV", "preview")
    expect(mustBlockPublicSite(resolved("placeholder"))).toBe(false)
    vi.stubEnv("VERCEL_ENV", "development")
    expect(mustBlockPublicSite(resolved("placeholder"))).toBe(false)
  })
})

describe("missingRequired", () => {
  it("does not require what cannot be supplied yet", () => {
    // No 통신판매업 신고번호 before the registration exists, and the privacy
    // officer belongs to a different statute. Blocking the site over either
    // would be a worse failure than the one being prevented.
    const missing = missingRequired({
      ...FULL_BUSINESS,
      mailOrderNumber: "",
      privacyOfficer: "",
    })
    expect(missing).toEqual([])
  })

  it("names every empty required field", () => {
    expect(missingRequired(EMPTY_BUSINESS_INFO)).toEqual([
      "businessName",
      "representativeName",
      "businessNumber",
      "address",
      "phone",
      "email",
    ])
  })
})
