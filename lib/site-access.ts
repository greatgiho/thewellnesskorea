import { NextResponse, type NextRequest } from "next/server"

export const SITE_ACCESS_COOKIE = "twk_site_access"
export const SITE_ACCESS_COOKIE_MAX_AGE = 60 * 60 * 24 * 14 // 14 days

const SITE_ACCESS_PAYLOAD = "twk-site-access-v1"

export function isSiteAccessEnabled(): boolean {
  const password = process.env.SITE_ACCESS_PASSWORD
  return typeof password === "string" && password.length > 0
}

export function safeNextPath(
  next: string | null | undefined,
  fallback = "/",
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return fallback
  }
  if (next.startsWith("/site-unlock")) return fallback
  return next
}

function authCallbackParams(params: URLSearchParams): boolean {
  return (
    params.has("code") ||
    (params.has("token_hash") && params.has("type"))
  )
}

export function shouldBypassSiteAccess(
  pathname: string,
  searchParams: URLSearchParams,
): boolean {
  if (pathname === "/site-unlock") return true
  if (pathname === "/auth/callback") return true
  if (authCallbackParams(searchParams)) return true
  return false
}

export async function createSiteAccessCookieValue(
  password: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(SITE_ACCESS_PAYLOAD),
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return diff === 0
}

export async function hasValidSiteAccessCookie(
  cookieValue: string | undefined,
): Promise<boolean> {
  const password = process.env.SITE_ACCESS_PASSWORD
  if (!password || !cookieValue) return false
  const expected = await createSiteAccessCookieValue(password)
  return timingSafeEqual(cookieValue, expected)
}

export async function enforceSiteAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  if (!isSiteAccessEnabled()) return null

  const { pathname, searchParams } = request.nextUrl

  if (shouldBypassSiteAccess(pathname, searchParams)) return null

  const cookie = request.cookies.get(SITE_ACCESS_COOKIE)?.value
  if (await hasValidSiteAccessCookie(cookie)) return null

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = "/site-unlock"
  const next = `${pathname}${request.nextUrl.search}`
  redirectUrl.search = `next=${encodeURIComponent(next)}`
  return NextResponse.redirect(redirectUrl)
}
