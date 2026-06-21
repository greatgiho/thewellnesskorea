import { type NextRequest } from "next/server"
import { enforceSiteAccess } from "@/lib/site-access"
import { updateSession } from "@/lib/supabase/middleware"

export async function middleware(request: NextRequest) {
  const gateResponse = await enforceSiteAccess(request)
  if (gateResponse) return gateResponse
  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
