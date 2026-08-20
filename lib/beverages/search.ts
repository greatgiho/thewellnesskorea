/**
 * Finding one sale at a counter, from whatever the customer can tell you.
 *
 * Not by account id. PayPal's id for an account is a dozen opaque characters —
 * it is how code recognises a returning customer, not something anybody reads
 * across a counter. What a person can actually offer is one of four things:
 *
 *   - the name they gave, if a barista typed one
 *   - the name on the PayPal account that paid
 *   - the email on that account
 *   - the code on the receipt still open on their phone
 *
 * So all four are searched, and the caller does not have to know which one
 * they were handed. Everything else — the time, the price — is already on the
 * row and read by eye.
 */

/** The columns a counter search looks in, in the order they are likeliest. */
export const SEARCH_COLUMNS = [
  "nickname",
  "payer_name",
  "payer_email",
  "paypal_capture_id",
] as const

/**
 * Strip what would change the meaning of a PostgREST filter.
 *
 * `.or()` takes a raw filter string rather than a bound parameter: commas
 * separate its terms and parentheses group them, so a search for "Lee, Jiho"
 * would be read as two filters and one of them would be nonsense. `%` and `_`
 * are the LIKE wildcards, and `\` escapes them — a customer whose name has one
 * should not silently match everybody.
 *
 * Dropped rather than escaped. These characters do not appear in names, emails
 * or receipt codes, so nothing findable is lost, and there is no escaping
 * scheme here to get subtly wrong.
 */
export function sanitizeSearch(term: string): string {
  return term.replace(/[,()%_\\*]/g, "").trim()
}

/**
 * The PostgREST `or` filter for one search term, or null when there is nothing
 * left to search for — a term that was entirely punctuation must not turn into
 * a filter that matches every row.
 */
export function searchFilter(term: string): string | null {
  const safe = sanitizeSearch(term)
  if (!safe) return null
  return SEARCH_COLUMNS.map((column) => `${column}.ilike.%${safe}%`).join(",")
}
