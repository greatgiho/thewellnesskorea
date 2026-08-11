/**
 * The site's configured address.
 *
 * Use this where a link has to match what is registered somewhere else — auth
 * callbacks above all, since Supabase only redirects to addresses on its
 * allowlist, and a preview deployment's URL is not on it.
 */
export function siteOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewellnesskorea.com"
}

/**
 * The address of the deployment actually serving this request.
 *
 * For links that should lead back to where the visitor already is. On a preview
 * these two differ: NEXT_PUBLIC_SITE_URL there is dev.thewellnesskorea.com, so
 * a booking made on a preview would email a ticket link pointing at the dev
 * site — a different deployment, which may not even have the page yet. That is
 * exactly what happened while building the ticket: the email looked wrong
 * because it was written by a deployment nobody was looking at.
 *
 * VERCEL_BRANCH_URL rather than VERCEL_URL: the branch alias survives the next
 * push, and a ticket has to still work tomorrow. Falls back to the deployment
 * URL, then to the configured origin, so anywhere that is not a Vercel preview
 * behaves exactly as before.
 *
 * Not used for auth. Supabase would refuse the redirect.
 */
export function deploymentOrigin(): string {
  if (process.env.VERCEL_ENV === "preview") {
    const host = process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL
    if (host) return `https://${host}`
  }
  return siteOrigin()
}
