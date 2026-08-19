import { describe, expect, it } from "vitest"
import { shouldBypassSiteAccess } from "@/lib/site-access"

/**
 * What the pre-launch password does not stand in front of.
 *
 * Every entry is a path that cannot present a cookie: a machine calling us, or
 * a stranger holding a phone up to a printed QR. Getting this list wrong in
 * either direction is expensive — too narrow and the QR lands on a login
 * screen, too wide and the site is not locked.
 */

const bypasses = (pathname: string, search = "") =>
  shouldBypassSiteAccess(pathname, new URLSearchParams(search))

describe("shouldBypassSiteAccess", () => {
  it("lets the counter QR through", () => {
    // Printed and stuck to a counter. The person scanning it is standing in
    // the shop with money out; there is no password for them to have.
    expect(bypasses("/drinks")).toBe(true)
  })

  it("still gates the rest of the site", () => {
    expect(bypasses("/")).toBe(false)
    expect(bypasses("/book/abc")).toBe(false)
    expect(bypasses("/partners/someone")).toBe(false)
  })

  it("does not open anything under the drinks path", () => {
    // The exemption is one page, not a prefix — so adding a route below it
    // later is a decision someone has to make on purpose.
    expect(bypasses("/drinks/admin")).toBe(false)
  })

  it("lets the unlock screen and auth callbacks through", () => {
    expect(bypasses("/site-unlock")).toBe(true)
    expect(bypasses("/auth/callback")).toBe(true)
    expect(bypasses("/anything", "code=abc")).toBe(true)
    expect(bypasses("/anything", "token_hash=abc&type=magiclink")).toBe(true)
  })

  it("lets webhooks and cron through", () => {
    expect(bypasses("/api/webhooks/paypal")).toBe(true)
    expect(bypasses("/api/cron/expire-bookings")).toBe(true)
  })
})
