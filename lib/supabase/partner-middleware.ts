import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { VIEW_AS_COOKIE, decodeViewAs } from "@/lib/view-as"

export async function updatePartnerSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.next({ request })

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        )
        supabaseResponse = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        )
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  // pathname is /p/... — the portal is served on the main domain.
  const isPublicPage =
    pathname === "/p/login" ||
    pathname === "/p/signup" ||
    pathname === "/p/accept-invite"

  if (!isPublicPage) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/p/login"
      return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers })
    }

    const role = user.app_metadata?.role
    if (role !== "partner") {
      // Allow admins in read-only view-as (impersonating a partner) through;
      // requirePartnerSession resolves the target and mutations are blocked.
      const viewAs =
        role === "admin"
          ? await decodeViewAs(request.cookies.get(VIEW_AS_COOKIE)?.value)
          : null
      if (viewAs?.kind !== "partner") {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = "/p/login"
        redirectUrl.search = "error=not_partner"
        return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers })
      }
    }
  }

  // NOTE: no auto-redirect from /p/login -> /p here. The login form
  // navigates to /p on success, and the approval gate in
  // requirePartnerSession bounces non-approved partners back to the login page.
  // Auto-redirecting logged-in partners off the login page would loop with that
  // bounce for pending/rejected accounts.

  return supabaseResponse
}
