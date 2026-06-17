import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
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
