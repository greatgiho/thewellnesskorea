import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requirePartnerSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/partner/login")
  if (user.app_metadata?.role !== "teacher") redirect("/partner/login?error=not_teacher")

  // Load the linked partner profile
  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!partner) redirect("/partner/login?error=no_profile")

  return { supabase, user, partner }
}
