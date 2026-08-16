import { NextRequest, NextResponse } from "next/server"
import { enforceSiteAccess } from "@/lib/site-access"
import { updateSession } from "@/lib/supabase/middleware"
import { updatePartnerSession } from "@/lib/supabase/partner-middleware"
import { detailRouteCheck, slugOf } from "@/lib/seo/route-exists"
import {
  REFERRAL_COOKIE,
  REFERRAL_MAX_AGE,
  REFERRAL_PARAM,
  normalizeReferralCode,
} from "@/lib/referrals/cookie"

/**
 * A path that matches no route, so Next serves not-found.tsx with a real 404.
 *
 * Rewriting to it is the whole trick: an unmatched URL is the one case Next
 * still answers 404, because there is no page to stream first.
 */
const NOT_FOUND_REWRITE = "/__not-found__"

// The partner portal lives at /p/* on the main domain. Auth is the access
// boundary (no account = no entry), so a separate subdomain adds friction
// (extra public hostname + cert per environment) without any security benefit.
function isPartnerPath(pathname: string): boolean {
  // Exact "/p" or "/p/..." — NOT the public "/partners/[slug]" pages.
  return pathname === "/p" || pathname.startsWith("/p/")
}

export async function middleware(request: NextRequest) {
  if (isPartnerPath(request.nextUrl.pathname)) {
    // Partner portal gets its own auth guard and skips the site-access gate,
    // so partners can sign in even while the public site is locked pre-launch.
    return updatePartnerSession(request)
  }

  const gateResponse = await enforceSiteAccess(request)
  if (gateResponse) return gateResponse

  // After the gate, so a locked site does not answer questions about what
  // exists, and before the session refresh, because a 404 has no session to
  // keep warm.
  const check = detailRouteCheck(request.nextUrl.pathname)
  if (check && (await check(slugOf(request.nextUrl.pathname))) === "missing") {
    return NextResponse.rewrite(new URL(NOT_FOUND_REWRITE, request.url))
  }

  const response = await updateSession(request)
  rememberReferral(request, response)
  return response
}

/**
 * Keep a ?ref= from the URL for as long as the booking might take.
 *
 * Set here rather than on a page because a referral link can point anywhere —
 * the homepage, a class, a partner's profile — and every one of them passes
 * through this. Written onto whatever response was already being returned, so
 * it survives a redirect as well as a render.
 *
 * The code is not checked against the referrers table here. That would be a
 * database round trip on every request carrying a query string, to reject
 * something the booking side has to re-check anyway; an unknown code parked in
 * a cookie costs nothing and attributes nothing.
 */
function rememberReferral(request: NextRequest, response: NextResponse): void {
  const code = normalizeReferralCode(
    request.nextUrl.searchParams.get(REFERRAL_PARAM),
  )
  if (!code) return

  // Last click wins: overwriting is the rule, not an accident.
  response.cookies.set(REFERRAL_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: REFERRAL_MAX_AGE,
    path: "/",
  })
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
