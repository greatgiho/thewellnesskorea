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

  if (authCallbackParams(params)) {
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
  const isAdminLoginPage = pathname === "/a/login"
  const isMemberLoginPage = pathname === "/u/login" || pathname === "/login"
  const isMemberSignupPage = pathname === "/u/signup"
  const isMemberCheckEmailPage = pathname === "/login/check-email"
  // Protected member area = /u and /u/* EXCEPT the login/signup pages
  // (those must be reachable while signed out).
  const isAccountRoute =
    (pathname === "/u" || pathname.startsWith("/u/")) &&
    !isMemberLoginPage &&
    !isMemberSignupPage
  const role = authRole(user)
  const signupIntent =
    typeof user?.user_metadata?.signup_intent === "string"
      ? user.user_metadata.signup_intent
      : null
  const isMemberIntent = signupIntent === "member" || role === "member"

  if (isAccountRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/u/login"
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
      redirectUrl.pathname = "/a/login"
      return NextResponse.redirect(redirectUrl)
    }
    if (isMemberIntent || role === "member") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/u/bookings"
      return NextResponse.redirect(redirectUrl)
    }
    if (role !== "admin") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/a/login"
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
  }

  if (isMemberCheckEmailPage && user && isMemberIntent) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/u/bookings"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
