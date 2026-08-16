import { describe, expect, it } from "vitest"

/**
 * A `code` in the query string means two different things on this site.
 *
 * Supabase puts one there on a magic-link callback. A payment processor puts
 * one there when it sends a customer back after a failure — and it picked that
 * name, not us. The middleware could not tell them apart, so pressing cancel
 * in the payment window exchanged `code=PAY_PROCESS_CANCELED` for a session,
 * failed, and dumped the customer on the homepage with ?error=auth.
 *
 * The rule is duplicated here rather than imported because the module it lives
 * in reaches for Supabase env at import time. What is worth pinning is the
 * decision, not the wiring: these paths must never be read as auth callbacks.
 */
function isPaymentReturnPath(pathname: string): boolean {
  return pathname.startsWith("/book/toss/")
}

describe("isPaymentReturnPath", () => {
  it("covers every path a payment can come back to", () => {
    // successUrl, failUrl, and where failUrl forwards to. A `code` arrives on
    // the second and is passed along to the third.
    expect(isPaymentReturnPath("/book/toss/success")).toBe(true)
    expect(isPaymentReturnPath("/book/toss/fail")).toBe(true)
    expect(isPaymentReturnPath("/book/toss/failed")).toBe(true)
    expect(isPaymentReturnPath("/book/toss/pending")).toBe(true)
  })

  it("leaves the real auth landing places alone", () => {
    // A magic link can land anywhere, so the exemption has to stay narrow —
    // widening it to /book would break sign-in links sent about a booking.
    expect(isPaymentReturnPath("/auth/callback")).toBe(false)
    expect(isPaymentReturnPath("/")).toBe(false)
    expect(isPaymentReturnPath("/u/bookings")).toBe(false)
    expect(isPaymentReturnPath("/book/pay")).toBe(false)
    expect(isPaymentReturnPath("/book/find")).toBe(false)
  })
})
