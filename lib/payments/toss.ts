import "server-only"

/**
 * Toss Payments, for the KRW half of the catalogue.
 *
 * PayPal cannot charge won and Toss cannot charge dollars, so the two are not
 * alternatives a customer picks between — the price decides. See
 * onlineProviderFor() in lib/payments/money.ts.
 *
 * One base URL, live and test alike: unlike PayPal there is no sandbox host.
 * A test key and a live key hit the same endpoint and the key decides which
 * world you are in, which is worth knowing before going looking for the
 * sandbox setting that does not exist.
 */

const BASE = "https://api.tosspayments.com"

function secretKey(): string {
  const key = process.env.TOSS_SECRET_KEY
  if (!key) throw new Error("Toss secret key missing (TOSS_SECRET_KEY).")
  return key
}

/** Both keys, or the payment cannot be started and cannot be finished. */
export function isTossConfigured(): boolean {
  return Boolean(
    process.env.TOSS_SECRET_KEY && process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  )
}

/**
 * Basic auth with the secret key as the username and an empty password — the
 * trailing colon is not decoration, and dropping it gets a 401 that reads like
 * a bad key.
 */
function authHeader(): string {
  return `Basic ${Buffer.from(`${secretKey()}:`).toString("base64")}`
}

/**
 * What Toss says a payment is now.
 *
 * DONE is the only one that means money has moved. WAITING_FOR_DEPOSIT is a
 * virtual account that has been issued and not paid into — the customer has a
 * number to transfer to, and the deposit arrives (or does not) hours later by
 * webhook.
 */
export type TossPaymentStatus =
  | "READY"
  | "IN_PROGRESS"
  | "WAITING_FOR_DEPOSIT"
  | "DONE"
  | "CANCELED"
  | "PARTIAL_CANCELED"
  | "ABORTED"
  | "EXPIRED"

export type TossPayment = {
  paymentKey: string
  orderId: string
  status: TossPaymentStatus
  totalAmount: number
  currency: string
  method?: string
  approvedAt?: string | null
  requestedAt?: string
}

export class TossError extends Error {
  readonly code: string
  readonly httpStatus: number

  constructor(code: string, message: string, httpStatus: number) {
    super(message)
    this.name = "TossError"
    this.code = code
    this.httpStatus = httpStatus
  }
}

async function request(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; idempotencyKey?: string },
): Promise<TossPayment> {
  const res = await fetch(`${BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
      // Toss deduplicates on this, so a double-submitted confirm settles as one
      // payment instead of two. The order id is the natural key: one booking,
      // one charge.
      ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  })

  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    // Toss answers failures with {code, message} and the code is the part worth
    // branching on — the message is Korean prose meant for a person.
    throw new TossError(
      typeof data.code === "string" ? data.code : "UNKNOWN",
      typeof data.message === "string" ? data.message : `HTTP ${res.status}`,
      res.status,
    )
  }
  return data as unknown as TossPayment
}

/**
 * Turn an authorisation the customer just completed into a charge.
 *
 * Nothing has been taken until this runs. The browser comes back from Toss
 * with a paymentKey and an amount in the query string, and both are the
 * customer's to edit — so the caller must check the amount against what the
 * booking actually costs before calling this. Toss checks it too, and refuses
 * a mismatch, but the caller is the one that knows the real price.
 */
export async function confirmPayment(input: {
  paymentKey: string
  orderId: string
  amount: number
}): Promise<TossPayment> {
  return request("/v1/payments/confirm", {
    method: "POST",
    body: input,
    idempotencyKey: input.orderId,
  })
}

/** Current state, straight from Toss. */
export async function getPaymentByKey(paymentKey: string): Promise<TossPayment> {
  return request(`/v1/payments/${encodeURIComponent(paymentKey)}`, {
    method: "GET",
  })
}

/** Same, by our own order id — what a webhook gives us a way to verify. */
export async function getPaymentByOrderId(
  orderId: string,
): Promise<TossPayment> {
  return request(`/v1/payments/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
  })
}

/** Refund, whole or partial. Omit the amount to cancel all of it. */
export async function cancelPayment(input: {
  paymentKey: string
  reason: string
  amount?: number
}): Promise<TossPayment> {
  return request(`/v1/payments/${encodeURIComponent(input.paymentKey)}/cancel`, {
    method: "POST",
    body: {
      cancelReason: input.reason,
      ...(input.amount != null ? { cancelAmount: input.amount } : {}),
    },
  })
}
