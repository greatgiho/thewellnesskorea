import { describe, it, expect, afterEach } from "vitest"
import { allowedRecipients, canonicalAddress } from "@/lib/notifications/email"

const ORIGINAL = process.env.EMAIL_ALLOWLIST

afterEach(() => {
  if (ORIGINAL === undefined) delete process.env.EMAIL_ALLOWLIST
  else process.env.EMAIL_ALLOWLIST = ORIGINAL
})

describe("canonicalAddress", () => {
  it("strips a plus tag, which is how the same inbox books twice", () => {
    expect(canonicalAddress("ikim+hv@humantrust.one")).toBe("ikim@humantrust.one")
    expect(canonicalAddress("ikim+jkv+2@humantrust.one")).toBe("ikim@humantrust.one")
  })

  it("ignores case and surrounding space", () => {
    expect(canonicalAddress("  IKIM+X@Humantrust.One ")).toBe("ikim@humantrust.one")
  })

  it("leaves dots alone, on every domain", () => {
    // Gmail ignores dots, and so does every Google Workspace domain — which
    // the domain name does not tell you. Guessing gets Workspace wrong one way
    // and, at providers where a dot separates two people, sends to a stranger
    // the other. Too strict only fails to send.
    expect(canonicalAddress("great.kit@gmail.com")).toBe("great.kit@gmail.com")
    expect(canonicalAddress("great.kit@humantrust.one")).toBe("great.kit@humantrust.one")
  })

  it("strips the tag whatever the domain", () => {
    expect(canonicalAddress("a+1@gmail.com")).toBe("a@gmail.com")
    expect(canonicalAddress("a+1@humantrust.one")).toBe("a@humantrust.one")
    expect(canonicalAddress("a+1@naver.com")).toBe("a@naver.com")
  })

  it("leaves something that is not an address alone", () => {
    expect(canonicalAddress("not-an-address")).toBe("not-an-address")
    expect(canonicalAddress("@nolocal.com")).toBe("@nolocal.com")
  })
})

describe("allowedRecipients", () => {
  const all = ["ikim@humantrust.one", "stranger@example.com"]

  it("does not restrict when the variable is absent", () => {
    delete process.env.EMAIL_ALLOWLIST
    expect(allowedRecipients(all, "test")).toEqual(all)
  })

  it("sends to nobody when it is set but blank", () => {
    // Fails closed on purpose: a value that saves empty must not silently
    // reopen the guard on the one environment that needs it.
    process.env.EMAIL_ALLOWLIST = "   "
    expect(allowedRecipients(all, "test")).toEqual([])
  })

  it("keeps only listed mailboxes", () => {
    process.env.EMAIL_ALLOWLIST = "ikim@humantrust.one"
    expect(allowedRecipients(all, "test")).toEqual(["ikim@humantrust.one"])
  })

  it("lets a listed mailbox through under any plus tag", () => {
    process.env.EMAIL_ALLOWLIST = "ikim@humantrust.one"
    expect(
      allowedRecipients(["ikim+hv@humantrust.one", "ikim+jkv@humantrust.one"], "test"),
    ).toEqual(["ikim+hv@humantrust.one", "ikim+jkv@humantrust.one"])
  })

  it("mails the address as written, not the canonical form", () => {
    process.env.EMAIL_ALLOWLIST = "greatkit@gmail.com"
    expect(allowedRecipients(["greatkit+x@gmail.com"], "test")).toEqual([
      "greatkit+x@gmail.com",
    ])
  })

  it("covers the addresses actually used for testing", () => {
    process.env.EMAIL_ALLOWLIST = "ikim@humantrust.one"
    expect(
      allowedRecipients(
        ["ikim+74@humantrust.one", "ikim+hv@humantrust.one", "ikim@humantrust.one"],
        "test",
      ),
    ).toHaveLength(3)
  })

  it("sends to nobody rather than everybody when nothing matches", () => {
    process.env.EMAIL_ALLOWLIST = "someone@else.com"
    expect(allowedRecipients(all, "test")).toEqual([])
  })
})
