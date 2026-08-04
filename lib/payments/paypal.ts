import "server-only"

// PayPal Orders API v2. Sandbox by default; set PAYPAL_ENV=live for production.
const BASE =
  process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

function credentials() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error(
      "PayPal credentials missing (NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET).",
    )
  }
  return { clientId, secret }
}

async function accessToken(): Promise<string> {
  const { clientId, secret } = credentials()
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64")
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  })
  if (!res.ok) {
    throw new Error(`PayPal token request failed: ${res.status}`)
  }
  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

export type CreatedOrder = { id: string; status: string }

export async function createOrder(input: {
  amount: string // decimal string, e.g. "1.00"
  currency?: string // PayPal-supported (NOT KRW); default USD
  reference?: string // custom_id (e.g. booking id)
}): Promise<CreatedOrder> {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: input.currency ?? "USD", value: input.amount },
          ...(input.reference ? { custom_id: input.reference } : {}),
        },
      ],
    }),
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`PayPal createOrder failed: ${res.status} ${JSON.stringify(data)}`)
  }
  return { id: data.id, status: data.status }
}

export type CaptureResult = {
  orderId: string
  status: string // order-level status
  captureStatus?: string // capture-level status: COMPLETED | PENDING | DECLINED | ...
  captureId?: string
  amount?: string
  currency?: string
}

export async function captureOrder(orderId: string): Promise<CaptureResult> {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`PayPal captureOrder failed: ${res.status} ${JSON.stringify(data)}`)
  }
  const capture = data?.purchase_units?.[0]?.payments?.captures?.[0]
  return {
    orderId: data.id,
    status: data.status,
    captureStatus: capture?.status,
    captureId: capture?.id,
    amount: capture?.amount?.value,
    currency: capture?.amount?.currency_code,
  }
}

/**
 * Current state of a capture, straight from PayPal.
 *
 * A capture that came back PENDING at checkout is resolved by webhook, so
 * nothing polls this in the normal case. It exists for the abnormal one: a
 * webhook that never arrives leaves the booking holding a seat with no way
 * back, so the daily cron asks PayPal directly instead of waiting forever.
 */
export async function getCaptureStatus(captureId: string): Promise<string | undefined> {
  const token = await accessToken()
  const res = await fetch(`${BASE}/v2/payments/captures/${captureId}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(`PayPal getCapture failed: ${res.status} ${JSON.stringify(data)}`)
  }
  return data?.status as string | undefined
}

export type WebhookHeaders = {
  transmissionId: string
  transmissionTime: string
  certUrl: string
  authAlgo: string
  transmissionSig: string
}

/**
 * Verify a PayPal webhook signature via the PayPal API. Requires
 * PAYPAL_WEBHOOK_ID (from the webhook registered in the PayPal dashboard).
 * Returns false if not configured or verification fails.
 */
export async function verifyWebhookSignature(
  headers: WebhookHeaders,
  rawBody: string,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) return false

  const token = await accessToken()
  const res = await fetch(`${BASE}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transmission_id: headers.transmissionId,
      transmission_time: headers.transmissionTime,
      cert_url: headers.certUrl,
      auth_algo: headers.authAlgo,
      transmission_sig: headers.transmissionSig,
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
    cache: "no-store",
  })
  if (!res.ok) return false
  const data = (await res.json()) as { verification_status?: string }
  return data.verification_status === "SUCCESS"
}
