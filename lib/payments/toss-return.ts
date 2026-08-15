import type { NextRequest } from "next/server"

/**
 * The three values Toss hands back, from wherever it decided to put them.
 *
 * Toss does not always come back the same way. A plain card payment returns as
 * a top-level GET with the values in the query string; an app-authenticated
 * one — 간편결제, 앱카드, the flows that bounce through the phone — returns as a
 * form POST. Production logs caught the second kind hitting a GET-only handler:
 *
 *   ε POST /book/toss/success   → 405
 *
 * A 405 there is a customer who authorised a payment and got an error page,
 * with an authorisation sitting at Toss that nobody confirmed. So both verbs
 * are accepted and both places are read.
 */

export type TossReturn = {
  paymentKey: string | null
  orderId: string | null
  amount: number
  /** Only on the failure path. */
  code: string | null
  message: string | null
}

function pick(
  form: URLSearchParams | null,
  query: URLSearchParams,
  key: string,
): string | null {
  // Body first: on a POST the query string is usually empty, and when both are
  // present the body is the one Toss filled in deliberately.
  return form?.get(key) ?? query.get(key)
}

export async function readTossReturn(
  request: NextRequest,
): Promise<TossReturn> {
  const query = request.nextUrl.searchParams

  let form: URLSearchParams | null = null
  if (request.method === "POST") {
    try {
      const body = await request.formData()
      form = new URLSearchParams()
      for (const [k, v] of body.entries()) {
        if (typeof v === "string") form.set(k, v)
      }
    } catch {
      // A body we cannot parse is not worth failing over — the query string
      // may still carry everything, and if it does not, the caller's own
      // validation catches it.
      form = null
    }
  }

  const amount = pick(form, query, "amount")

  return {
    paymentKey: pick(form, query, "paymentKey"),
    orderId: pick(form, query, "orderId"),
    amount: amount == null ? NaN : Number(amount),
    code: pick(form, query, "code"),
    message: pick(form, query, "message"),
  }
}
