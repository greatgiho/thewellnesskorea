/**
 * Who paid, as far as PayPal will say.
 *
 * Apart from paypal.ts because it is a pure reading of a response body, and
 * that file cannot be imported by a test: it is server-only, being the thing
 * that holds the credentials. The shapes here are the whole reason this needs
 * checking — they are written from PayPal's documentation, not from a capture
 * anybody has watched arrive.
 */

/**
 * Who paid, as far as PayPal will say.
 *
 * Every field is optional because which ones come back depends on how the
 * money was found. A PayPal account gives a name, an email and an account id;
 * a guest paying by card gives a brand and four digits and often a name. Code
 * reading this must work when it is entirely empty — that is a payment that
 * went through, not an error.
 */
export type Payer = {
  name?: string
  email?: string
  accountId?: string
  /** Already formatted for reading aloud: "VISA ····4242". */
  card?: string
}


/** "Jiho Lee" from PayPal's split name, or nothing rather than a stray space. */
function joinName(name: unknown): string | undefined {
  const n = name as { given_name?: string; surname?: string } | undefined
  const joined = [n?.given_name, n?.surname].filter(Boolean).join(" ").trim()
  return joined || undefined
}

/**
 * Read the payer out of a capture response.
 *
 * Two shapes, because there are two ways to pay. `payment_source.paypal` is an
 * account; `payment_source.card` is somebody who never made one. The top-level
 * `payer` block is checked last: it is the older place this lived, and it is
 * still populated for wallet payments.
 *
 * Deliberately total — anything missing is simply left out. PayPal returns
 * what the buyer's account and the transaction allow, and a payment that
 * arrives anonymous is still a payment.
 */
export function readPayer(data: unknown): Payer {
  const d = (data ?? {}) as Record<string, any>
  const source = d.payment_source ?? {}
  const paypal = source.paypal
  const card = source.card

  const payer: Payer = {
    name: joinName(paypal?.name) ?? joinName(d.payer?.name) ?? card?.name,
    email: paypal?.email_address ?? d.payer?.email_address,
    accountId: paypal?.account_id ?? d.payer?.payer_id,
  }

  if (card?.last_digits) {
    payer.card = `${card.brand ?? "CARD"} ····${card.last_digits}`
  }

  // Undefined rather than empty strings, so "not returned" has one spelling.
  for (const key of Object.keys(payer) as (keyof Payer)[]) {
    if (!payer[key]) delete payer[key]
  }
  return payer
}
