import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { canAccessPartnerPortal } from "@/lib/partners/registration-status"

export async function requirePartnerSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/p/login")
  if (user.app_metadata?.role !== "partner") redirect("/p/login?error=not_partner")

  // Load the linked partner profile
  const { data: partner } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!partner) redirect("/p/login?error=no_profile")

  // Approval gate: pending/rejected self-registrations cannot access the portal.
  if (!canAccessPartnerPortal(partner.registration_status)) {
    redirect("/p/login?error=not_approved")
  }

  return { supabase, user, partner }
}
