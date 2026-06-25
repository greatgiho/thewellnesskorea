import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { completeAuthFromUrl } from "@/lib/supabase/complete-auth-from-url"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const next = searchParams.get("next") ?? "/apply/profile"

  const supabase = await createClient()
  const { ok } = await completeAuthFromUrl(supabase, searchParams)

  if (ok) {
    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/apply?error=auth`)
}
