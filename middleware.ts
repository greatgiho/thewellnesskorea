import { NextRequest, NextResponse } from "next/server"
import { enforceSiteAccess } from "@/lib/site-access"
import { updateSession } from "@/lib/supabase/middleware"
import { updatePartnerSession } from "@/lib/supabase/partner-middleware"

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
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
