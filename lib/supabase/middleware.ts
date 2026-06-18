import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { completeAuthFromUrl } from "@/lib/supabase/complete-auth-from-url"
import { mustChangePassword } from "@/lib/auth/must-change-password"

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
    const next = params.get("next") ?? "/apply/profile"
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = next
    redirectUrl.search = ""

    if (ok) {
      return redirectWithSessionCookies(redirectUrl, supabaseResponse)
    }

    redirectUrl.pathname = "/apply"
    redirectUrl.search = "error=auth"
    return NextResponse.redirect(redirectUrl)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAdminRoute = pathname.startsWith("/admin")
  const isAdminLoginPage = pathname === "/admin/login"
  const isApplyProfile = pathname.startsWith("/apply/profile")
  const isTeacherRoute = pathname.startsWith("/teacher")
  const isTeacherLoginPage = pathname === "/teacher/login"
  const isTeacherChangePasswordPage = pathname === "/teacher/change-password"
  const isAccountRoute = pathname.startsWith("/account")
  const isMemberLoginPage = pathname === "/login"
  const isMemberSignupPage = pathname === "/signup"
  const isMemberCheckEmailPage = pathname === "/login/check-email"
  const role = authRole(user)
  const signupIntent =
    typeof user?.user_metadata?.signup_intent === "string"
      ? user.user_metadata.signup_intent
      : null
  const isMemberIntent = signupIntent === "member" || role === "member"

  if (isApplyProfile && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/apply"
    return NextResponse.redirect(redirectUrl)
  }

  if (isAccountRoute && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    return NextResponse.redirect(redirectUrl)
  }

  if ((isMemberLoginPage || isMemberSignupPage) && user && isMemberIntent) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/account/bookings"
    return NextResponse.redirect(redirectUrl)
  }

  if (isTeacherRoute && !isTeacherLoginPage) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/teacher/login"
      return NextResponse.redirect(redirectUrl)
    }
    if (role === "member" || isMemberIntent) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/account/bookings"
      return NextResponse.redirect(redirectUrl)
    }
    if (role === "admin") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/admin/people"
      return NextResponse.redirect(redirectUrl)
    }
    if (
      mustChangePassword(user) &&
      !isTeacherChangePasswordPage
    ) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/teacher/change-password"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isTeacherLoginPage && user && role === "teacher") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = mustChangePassword(user)
      ? "/teacher/change-password"
      : "/teacher"
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminRoute && !isAdminLoginPage) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/admin/login"
      return NextResponse.redirect(redirectUrl)
    }
    if (role === "teacher") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/teacher"
      return NextResponse.redirect(redirectUrl)
    }
    if (isMemberIntent) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/account/bookings"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isAdminLoginPage && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname =
      role === "teacher"
        ? "/teacher"
        : isMemberIntent
          ? "/account/bookings"
          : "/admin/people"
    return NextResponse.redirect(redirectUrl)
  }

  if (isMemberCheckEmailPage && user && isMemberIntent) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/account/bookings"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
