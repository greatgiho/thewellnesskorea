import { describe, expect, it } from "vitest"
import { readPayer } from "@/lib/payments/payer"

/**
 * Reading the buyer out of a PayPal capture.
 *
 * Nothing here has been seen against the live API — there is no sandbox buyer
 * account to complete a capture with — so these are written from the documented
 * shapes. That makes the important cases the empty ones: whatever PayPal
 * actually sends, a payment that arrives without a name is a payment, not an
 * error, and this must never be the reason a sale fails to record.
 */

describe("readPayer", () => {
  it("reads a PayPal account", () => {
    expect(
      readPayer({
        payment_source: {
          paypal: {
            email_address: "jiho@example.com",
            account_id: "9XJ2K4L8MNPQ",
            account_status: "VERIFIED",
            name: { given_name: "Jiho", surname: "Lee" },
          },
        },
      }),
    ).toEqual({
      name: "Jiho Lee",
      email: "jiho@example.com",
      accountId: "9XJ2K4L8MNPQ",
    })
  })

  it("reads a guest card payment", () => {
    // No account, so no name to call out unless the card carried one. The
    // digits are what makes the sale findable for a refund.
    expect(
      readPayer({
        payment_source: {
          card: { brand: "VISA", last_digits: "4242", name: "JIHO LEE" },
        },
      }),
    ).toEqual({ name: "JIHO LEE", card: "VISA ····4242" })
  })

  it("names an unbranded card something rather than nothing", () => {
    expect(readPayer({ payment_source: { card: { last_digits: "1881" } } })).toEqual(
      { card: "CARD ····1881" },
    )
  })

  it("falls back to the top-level payer block", () => {
    // Where this used to live, and still populated for wallet payments.
    expect(
      readPayer({
        payer: {
          name: { given_name: "Yuna", surname: "Im" },
          email_address: "yuna@example.com",
          payer_id: "ABCD1234",
        },
      }),
    ).toEqual({ name: "Yuna Im", email: "yuna@example.com", accountId: "ABCD1234" })
  })

  it("prefers payment_source over the older payer block", () => {
    expect(
      readPayer({
        payment_source: { paypal: { email_address: "new@example.com" } },
        payer: { email_address: "old@example.com" },
      }).email,
    ).toBe("new@example.com")
  })

  it("is empty rather than broken when PayPal says nothing", () => {
    // The case that must not throw. A capture with no buyer detail is money
    // that arrived, and the sale still has to be recorded.
    expect(readPayer({})).toEqual({})
    expect(readPayer(null)).toEqual({})
    expect(readPayer(undefined)).toEqual({})
    expect(readPayer({ payment_source: {} })).toEqual({})
  })

  it("leaves out a half-filled name rather than keeping a stray space", () => {
    expect(readPayer({ payment_source: { paypal: { name: {} } } })).toEqual({})
    expect(
      readPayer({ payment_source: { paypal: { name: { given_name: "Mia" } } } }),
    ).toEqual({ name: "Mia" })
  })

  it("drops empty strings instead of storing them", () => {
    // "" and "not returned" would otherwise be two spellings of the same
    // thing, and the display has to know whether to fall back.
    expect(
      readPayer({
        payment_source: { paypal: { email_address: "", account_id: "" } },
      }),
    ).toEqual({})
  })
})
