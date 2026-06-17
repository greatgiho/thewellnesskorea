import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

function authRole(user: { app_metadata?: Record<string, unknown> } | null) {
  const role = user?.app_metadata?.role
  return typeof role === "string" ? role : null
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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const authCode = request.nextUrl.searchParams.get("code")

  // Supabase may redirect to Site URL (/) when callback URL is not allowlisted.
  if (authCode && pathname !== "/auth/callback") {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/auth/callback"
    if (!redirectUrl.searchParams.has("next")) {
      redirectUrl.searchParams.set("next", "/apply/profile")
    }
    return NextResponse.redirect(redirectUrl)
  }

  const isAdminRoute = pathname.startsWith("/admin")
  const isLoginPage = pathname === "/admin/login"
  const isApplyProfile = pathname.startsWith("/apply/profile")
  const role = authRole(user)

  if (isApplyProfile && !user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/apply"
    return NextResponse.redirect(redirectUrl)
  }

  if (isAdminRoute && !isLoginPage) {
    if (!user) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/admin/login"
      return NextResponse.redirect(redirectUrl)
    }
    if (role === "teacher") {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/apply/profile"
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (isLoginPage && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname =
      role === "teacher" ? "/apply/profile" : "/admin/people"
    return NextResponse.redirect(redirectUrl)
  }

  return supabaseResponse
}
