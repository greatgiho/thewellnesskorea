import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Guard for the collaborator dashboard.
 *
 * Admins pass too, so they can look at the same screen as a collaborator.
 *
 * This used to say there was no write path behind it. Referrals are now the
 * exception (063): viewers manage those, because the person doing that work
 * holds a viewer account and the alternative was sharing the admin password.
 * Everything else behind this guard is still read-only, enforced by RLS rather
 * than by the pages.
 */
export async function requireViewerSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/a/signin")

  const role = user.app_metadata?.role
  if (role !== "viewer" && role !== "admin") {
    redirect("/a/signin?error=not_admin")
  }

  return { supabase, user, role: role as "viewer" | "admin" }
}

/**
 * Guard for the referral write actions: admin or viewer, nobody else.
 *
 * Named separately from requireViewerSession so a call site that mutates says
 * so. Same check today; if the two roles ever need to diverge here, this is
 * the one place that changes.
 */
export async function requireReferralEditor() {
  return requireViewerSession()
}
