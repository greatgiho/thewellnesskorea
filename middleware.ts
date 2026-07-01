import { NextRequest, NextResponse } from "next/server"
import { enforceSiteAccess } from "@/lib/site-access"
import { updateSession } from "@/lib/supabase/middleware"
import { updatePartnerSession } from "@/lib/supabase/partner-middleware"

function isPartnerSubdomain(request: NextRequest): boolean {
  const host = request.headers.get("host") ?? ""
  const partnerHost = process.env.NEXT_PUBLIC_PARTNER_HOST
  if (partnerHost && host === partnerHost) return true
  // Local dev: partner.localhost or partner.localhost:3000
  return host.startsWith("partner.")
}

function rewriteToPartner(request: NextRequest): NextRequest {
  const url = request.nextUrl.clone()
  // /foo → /partner/foo, / → /partner
  url.pathname = url.pathname === "/" ? "/partner" : `/partner${url.pathname}`
  return new NextRequest(url, request)
}

export async function middleware(request: NextRequest) {
  if (isPartnerSubdomain(request)) {
    const rewritten = rewriteToPartner(request)
    return updatePartnerSession(rewritten)
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
