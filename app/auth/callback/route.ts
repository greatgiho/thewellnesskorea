import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeAuthFromUrl } from "@/lib/supabase/complete-auth-from-url"
import { completeMemberOnboarding } from "@/lib/auth/member-account"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get("next") ?? "/"
  const flow = searchParams.get("flow")

  const supabase = await createClient()
  const { ok } = await completeAuthFromUrl(supabase, searchParams)

  if (ok) {
    // Member OAuth (e.g. Google): the fresh account has no role/signup_intent,
    // so mark it as a member here before the /u gate runs.
    if (flow === "member") {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        try {
          await completeMemberOnboarding(user, { treatAsMember: true })
        } catch {
          // A partner/admin email tried member OAuth. Don't leave them signed
          // in as the wrong role — sign out and bounce back with a notice.
          // (completeMemberOnboarding refuses instead of clobbering the role.)
          await supabase.auth.signOut()
          return NextResponse.redirect(
            `${origin}/u/signin?error=wrong_account`,
          )
        }
      }
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  const errorPath = flow === "member" ? "/u/signin?error=auth" : "/?error=auth"
  return NextResponse.redirect(`${origin}${errorPath}`)
}
