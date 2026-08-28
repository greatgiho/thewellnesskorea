/**
 * Moving a moment between an `<input type="datetime-local">` and the database.
 *
 * A datetime-local holds a wall clock with no zone attached: "2026-08-28T13:27"
 * means 13:27 wherever the person reading it happens to be. A timestamptz holds
 * an instant. Converting between them is the browser's job, because only the
 * browser knows which wall clock the reader is looking at.
 *
 * The coupon form used to do this by slicing the ISO string — `.slice(0, 16)`
 * one way, and handing the naive string straight to PostgREST the other. Both
 * directions silently relabelled the reader's clock as UTC. In Seoul that is
 * nine hours: a coupon started at 13:27 by an admin in Seoul did not begin
 * until 22:27 that evening, and until then the booking form answered "This code
 * isn't active yet" — correctly, about a time nobody had chosen.
 *
 * It round-tripped, which is why it survived. Save 13:27, reopen, see 13:27.
 * The only place the nine hours appeared was in whether the coupon worked.
 */

/** The instant `iso` names, as a datetime-local value in the reader's own zone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ""
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ""

  const pad = (n: number) => String(n).padStart(2, "0")
  return (
    `${at.getFullYear()}-${pad(at.getMonth() + 1)}-${pad(at.getDate())}` +
    `T${pad(at.getHours())}:${pad(at.getMinutes())}`
  )
}

/**
 * The instant a datetime-local value names, read in the reader's own zone.
 *
 * A date-time string with no offset is parsed as local time, which is exactly
 * what the input meant by it.
 */
export function fromLocalInput(value: string | null | undefined): string | null {
  if (!value) return null
  const at = new Date(value)
  if (Number.isNaN(at.getTime())) return null
  return at.toISOString()
}
