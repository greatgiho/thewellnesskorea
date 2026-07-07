import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

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
  // pathname here is already /partner/... (rewritten by middleware)
  const isLoginPage = pathname === "/partner/login"

  if (!isLoginPage) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/partner/login"
      return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers })
    }

    const role = user.app_metadata?.role
    if (role !== "partner") {
      // Not a partner — redirect to login with error
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/partner/login"
      redirectUrl.search = "error=not_partner"
      return NextResponse.redirect(redirectUrl, { headers: supabaseResponse.headers })
    }
  }

  // NOTE: no auto-redirect from /partner/login -> /partner here. The login form
  // navigates to /partner on success, and the approval gate in
  // requirePartnerSession bounces non-approved partners back to the login page.
  // Auto-redirecting logged-in partners off the login page would loop with that
  // bounce for pending/rejected accounts.

  return supabaseResponse
}
