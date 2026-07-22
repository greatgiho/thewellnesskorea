import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { canAccessPartnerPortal } from "@/lib/partners/registration-status"
import { getViewAs } from "@/lib/view-as-server"
import type { ViewAsPayload } from "@/lib/view-as"

export async function requirePartnerSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/p/login")

  const role = user.app_metadata?.role

  // Admin read-only impersonation: resolve the TARGET partner instead of the
  // caller's own account. NOTE: deep data queries still run under the admin's
  // own RLS (my_partner_id() is empty for admins), so session/booking lists
  // are empty until target-scoped reads are wired (view-as data phase).
  if (role === "admin") {
    const viewAs = await getViewAs()
    if (viewAs?.kind === "partner") {
      const { data: partner } = await createServiceClient()
        .from("partners")
        .select("*")
        .eq("id", viewAs.id)
        .maybeSingle()
      if (partner) return { supabase, user, partner, viewAs }
    }
    redirect("/p/login?error=not_partner")
  }

  if (role !== "partner") redirect("/p/login?error=not_partner")

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

  return { supabase, user, partner, viewAs: null as ViewAsPayload | null }
}
