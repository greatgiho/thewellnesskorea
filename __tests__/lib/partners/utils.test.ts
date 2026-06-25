import { describe, it, expect } from "vitest"
import {
  slugify,
  normalizeInstagram,
  instagramHandle,
  isValidEmail,
  getInitials,
  sortPartnersByName,
} from "@/lib/partners/utils"

describe("slugify", () => {
  it("lowercases and replaces spaces with hyphens", () => {
    expect(slugify("Kim Ji Eun")).toBe("kim-ji-eun")
  })

  it("removes special characters", () => {
    expect(slugify("Park Soo-Yeon!")).toBe("park-soo-yeon")
  })

  it("collapses multiple hyphens", () => {
    expect(slugify("Lee  Min  Ho")).toBe("lee-min-ho")
  })

  it("trims whitespace", () => {
    expect(slugify("  Choi Jung Won  ")).toBe("choi-jung-won")
  })
})

describe("normalizeInstagram", () => {
  it("adds https://instagram.com/ for bare handles", () => {
    expect(normalizeInstagram("@wellness_ko")).toBe("https://instagram.com/wellness_ko")
  })

  it("passes full URL through", () => {
    expect(normalizeInstagram("https://instagram.com/wellness_ko")).toBe(
      "https://instagram.com/wellness_ko",
    )
  })

  it("returns null for empty string", () => {
    expect(normalizeInstagram("")).toBeNull()
  })

  it("returns null for whitespace-only string", () => {
    expect(normalizeInstagram("   ")).toBeNull()
  })

  it("strips @ from handle", () => {
    const result = normalizeInstagram("@myhandle")
    expect(result).toBe("https://instagram.com/myhandle")
  })
})

describe("instagramHandle", () => {
  it("extracts handle from instagram URL", () => {
    expect(instagramHandle("https://instagram.com/wellness_ko")).toBe("@wellness_ko")
  })

  it("passes @handle through", () => {
    expect(instagramHandle("@wellness_ko")).toBe("@wellness_ko")
  })

  it("returns null for null input", () => {
    expect(instagramHandle(null)).toBeNull()
  })
})

describe("isValidEmail", () => {
  it("accepts valid email", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
  })

  it("accepts empty string (optional field)", () => {
    expect(isValidEmail("")).toBe(true)
  })

  it("rejects missing @", () => {
    expect(isValidEmail("notanemail")).toBe(false)
  })

  it("rejects missing domain", () => {
    expect(isValidEmail("user@")).toBe(false)
  })

  it("accepts email with subdomains", () => {
    expect(isValidEmail("user@mail.example.co.kr")).toBe(true)
  })
})

describe("getInitials", () => {
  it("gets first letters of each word", () => {
    expect(getInitials("Kim Ji Eun")).toBe("KJ")
  })

  it("handles single name", () => {
    expect(getInitials("Areum")).toBe("A")
  })

  it("limits to 2 chars", () => {
    expect(getInitials("Lee Min Ho")).toBe("LM")
  })
})

describe("sortPartnersByName", () => {
  const partners = [
    { name_en: "Park Soo", created_at: "2026-01-01" },
    { name_en: "Kim Ji", created_at: "2026-01-02" },
    { name_en: "Ahn Young", created_at: "2026-01-03" },
  ]

  it("sorts alphabetically by name_en", () => {
    const sorted = sortPartnersByName(partners)
    expect(sorted.map((p) => p.name_en)).toEqual(["Ahn Young", "Kim Ji", "Park Soo"])
  })

  it("does not mutate the original array", () => {
    const original = [...partners]
    sortPartnersByName(partners)
    expect(partners).toEqual(original)
  })
})
