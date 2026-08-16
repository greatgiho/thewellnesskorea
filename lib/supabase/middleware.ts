import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { completeAuthFromUrl } from "@/lib/supabase/complete-auth-from-url"

function authRole(user: { app_metadata?: Record<string, unknown> } | null) {
  const role = user?.app_metadata?.role
  return typeof role === "string" ? role : null
}

function redirectWithSessionCookies(
  url: URL,
  supabaseResponse: NextResponse,
): NextResponse {
  return NextResponse.redirect(url, { headers: supabaseResponse.headers })
}

function authCallbackParams(params: URLSearchParams): boolean {
  return (
    params.has("code") ||
    (params.has("token_hash") && params.has("type"))
  )
}

/**
 * Paths where a `code` in the query is not Supabase's.
 *
 * A payment processor returning a customer to us puts its own error code in a
 * parameter called `code`, and it chose that name, not us. Without this, a
 * customer who simply pressed cancel in the payment window was sent to the
 * homepage with ?error=auth: the middleware read `code=PAY_PROCESS_CANCELED`
 * as a magic link, tried to exchange it for a session, failed, and bounced
 * them. No message, no way back to the booking — it just looked like the site
 * had thrown them out.
 *
 * Matched on the path rather than on the shape of the code because a code we
 * do not recognise is exactly the case that has to keep working.
 */
function isPaymentReturnPath(pathname: string): boolean {
  return pathname.startsWith("/book/toss/")
}

export async function updateSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    },
  )

  const pathname = request.nextUrl.pathname
  const params = request.nextUrl.searchParams

  // The dedicated /auth/callback route handler owns its own code exchange +
  // member onboarding (flow=member sets role=member). If the middleware
  // exchanged the code here first, it would consume the single-use PKCE code
  // and redirect away before the route runs, so OAuth users never get the
  // member role. Let /auth/callback fall through to its route handler; the
  // middleware still handles magic-link callbacks that land on other paths.
  if (
    authCallbackParams(params) &&
    pathname !== "/auth/callback" &&
    !isPaymentReturnPath(pathname)
  ) {
    const { ok } = await completeAuthFromUrl(supabase, params)
    const next = params.get("next") ?? "/"
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = next
    redirectUrl.search = ""

    if (ok) {
      return redirectWithSessionCookies(redirectUrl, supabaseResponse)
    }

    redirectUrl.pathname = "/"
    redirectUrl.search = "error=auth"
    return NextResponse.redirect(redirectUrl)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = pathname === "/a" || pathname.startsWith("/a/")
  const isAdminLoginPage = pathname === "/a/signin"
  // Read-only collaborator dashboard: schedule and occupancy only. Admins can
  // open it too, so they and a collaborator can look at the same screen.
  const isViewerRoute = pathname === "/v" || pathname.startsWith("/v/")
  const isMemberLoginPage = pathname === "/u/signin"
  const isMemberSignupPage = pathname === "/u/signup"
  const isMemberCheckEmailPage = pathname === "/u/check-email"
  // Protected member area = /u and /u/* EXCEPT the sign-in, sign-up, and
  // check-email pages. All three are reached while signed out — check-email in
  // particular is where a magic-link request lands, before the link is opened.
  const isAccountRoute =
    (pathname === "/u" || pathname.startsWith("/u/")) &&
    !isMemberLoginPage &&
    !isMemberSignupPage &&
    !isMemberCheckEmailPage
  const role = authRole(user)
  const signupIntent =
    typeof user?.user_metadata?.signup_intent === "string"
      ? user.user_metadata.signup_intent
      : null
  const isMemberIntent = signupIntent === "member" || role === "member"

  if (isAccountRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/u/signin"
    return NextResponse.redirect(redirectUrl)
  }

  if ((isMemberLoginPage || isMemberSignupPage) && user && isMemberIntent) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/u/bookings"
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminRoute && !isAdminLoginPage) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/a/signin"
      return NextResponse.redirect(redirectUrl)
    }
    if (isMemberIntent || role === "member") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/u/bookings"
      return NextResponse.redirect(redirectUrl)
    }
    // Read-only collaborators have their own dashboard; send them there rather
    // than to a sign-in page they are already past.
    if (role === "viewer") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/v"
      return NextResponse.redirect(redirectUrl)
    }
    if (role !== "admin") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/a/signin"
      redirectUrl.search = "error=not_admin"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isViewerRoute) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/a/signin"
      return NextResponse.redirect(redirectUrl)
    }
    if (role !== "viewer" && role !== "admin") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/a/signin"
      redirectUrl.search = "error=not_admin"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isAdminLoginPage && user) {
    if (isMemberIntent || role === "member") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/u/bookings"
      return NextResponse.redirect(redirectUrl)
    }
    if (role === "admin") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/a/partners"
      return NextResponse.redirect(redirectUrl)
    }
    // Collaborators sign in on the same form; land them on their dashboard.
    if (role === "viewer") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/v"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isMemberCheckEmailPage && user && isMemberIntent) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/u/bookings"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
