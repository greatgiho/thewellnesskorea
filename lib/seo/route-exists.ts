import { FALLBACK_JOURNAL_POSTS } from "@/lib/journal/fallback"

/**
 * Does this public detail page have anything behind it?
 *
 * Asked from the proxy, before the page renders, because that is the only
 * place left that can still set a status code. Next streams every dynamic
 * route, and once the shell has flushed the response is committed as 200 —
 * `notFound()` after that swaps the body and nothing else. Their docs say so
 * outright: "Next.js will return a 200 HTTP status code for streamed
 * responses, and 404 for non-streamed responses."
 *
 * So a soft 404 is not a bug to patch in the page. The check has to happen
 * earlier or not at all.
 *
 * Only the two indexable content routes are worth this. A wrong /journal or
 * /partners URL is something a search engine can find, follow and index; the
 * ticket and check-in URLs carry random tokens that nobody links to, and
 * paying for a database round trip on them would buy nothing.
 *
 * Plain fetch rather than a Supabase client: the proxy has no cookie jar to
 * hand one, and this needs a single anonymous read, not a session.
 */

type Existence = "exists" | "missing" | "unknown"

async function queryExists(path: string): Promise<Existence> {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!base || !key) return "unknown"

  try {
    const res = await fetch(`${base}/rest/v1/${path}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: "no-store",
    })
    if (!res.ok) return "unknown"
    const rows = (await res.json()) as unknown[]
    return Array.isArray(rows) && rows.length > 0 ? "exists" : "missing"
  } catch {
    // A failed lookup must never turn a real page into a 404. Anything other
    // than a clean "no rows" leaves the request alone.
    return "unknown"
  }
}

/** Mirrors getPublishedJournalPostBySlug, seed fallback included. */
export async function journalSlugExists(slug: string): Promise<Existence> {
  // The query falls back to the seeded posts when the row is missing, so a
  // seeded slug renders a real page even with nothing in the database. Miss
  // this and the proxy 404s an article the site is happily serving.
  if (FALLBACK_JOURNAL_POSTS.some((p) => p.slug === slug && p.is_published)) {
    return "exists"
  }
  return queryExists(
    `journal_posts?select=id&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&limit=1`,
  )
}

/** Mirrors getPartnerBySlug. */
export async function partnerSlugExists(slug: string): Promise<Existence> {
  return queryExists(
    `partners?select=id&slug=eq.${encodeURIComponent(slug)}&is_published=eq.true&registration_status=in.(admin,approved)&limit=1`,
  )
}

/**
 * The one-segment detail routes this applies to, and how to check them.
 * Returns null for anything else, so the proxy does no work on other paths.
 */
export function detailRouteCheck(
  pathname: string,
): ((slug: string) => Promise<Existence>) | null {
  const match = /^\/(journal|partners)\/([^/]+)\/?$/.exec(pathname)
  if (!match) return null
  return match[1] === "journal" ? journalSlugExists : partnerSlugExists
}

export function slugOf(pathname: string): string {
  const match = /^\/(?:journal|partners)\/([^/]+)\/?$/.exec(pathname)
  return match ? decodeURIComponent(match[1]) : ""
}
