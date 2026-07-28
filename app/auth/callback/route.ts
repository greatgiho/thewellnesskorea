import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeAuthFromUrl } from "@/lib/supabase/complete-auth-from-url"
import { completeMemberOnboarding } from "@/lib/auth/member-account"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get("next") ?? "/apply/profile"
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
          // e.g. an admin/partner tried member OAuth — let the /u gate handle it.
        }
      }
    }
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/apply?error=auth`)
}
