import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Guard for the read-only collaborator dashboard.
 *
 * Admins pass too, so they can look at the same screen as a collaborator.
 * There is no write path behind this guard by design — /v has no server
 * actions, and the viewer role has SELECT-only RLS policies.
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
