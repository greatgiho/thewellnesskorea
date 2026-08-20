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
  it("lets a counter order through", () => {
    // Shown as a QR on the counter screen. The person scanning it is standing
    // in the shop with money out; there is no password for them to have.
    expect(bypasses("/beverages/6f1b0b1e-0000-4000-8000-000000000000")).toBe(true)
  })

  it("still gates the rest of the site", () => {
    expect(bypasses("/")).toBe(false)
    expect(bypasses("/book/abc")).toBe(false)
    expect(bypasses("/partners/someone")).toBe(false)
  })

  it("does not open the beverages path with no order on it", () => {
    // /beverages is not a page. Exempting it would open a route that does not
    // exist today and would inherit the exemption on the day someone adds one.
    expect(bypasses("/beverages")).toBe(false)
  })

  it("never opens the admin screen that rings orders up", () => {
    // Naming customers and refunding money is not something a printed QR gets
    // to reach. Different prefix, and this is the assertion that keeps it so.
    expect(bypasses("/a/beverages")).toBe(false)
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
