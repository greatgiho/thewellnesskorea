import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { getViewAs } from "@/lib/view-as-server"
import type { ViewAsPayload } from "@/lib/view-as"

export async function requireAdminSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/a/login")
  if (user.app_metadata?.role !== "admin") redirect("/a/login")
  return { supabase, user, userId: user.id, userEmail: user.email }
}

export async function requireMemberSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/u/login")

  const role = user.app_metadata?.role

  // Admin read-only impersonation: resolve the TARGET member. userId/userEmail
  // point at the target; deep data still runs under the admin's RLS until
  // target-scoped reads are wired (view-as data phase).
  if (role === "admin") {
    const viewAs = await getViewAs()
    if (viewAs?.kind === "member") {
      const { data } = await createServiceClient().auth.admin.getUserById(
        viewAs.id,
      )
      const target = data?.user
      if (target?.email) {
        return {
          supabase,
          user,
          userId: target.id,
          userEmail: target.email,
          viewAs,
        }
      }
    }
    redirect("/")
  }

  if (!user.email) throw new Error("Email is required on your account.")

  const signupIntent = user.user_metadata?.signup_intent
  if (role !== "member" && signupIntent !== "member") redirect("/")

  return {
    supabase,
    user,
    userId: user.id,
    userEmail: user.email,
    viewAs: null as ViewAsPayload | null,
  }
}

export async function getOptionalMemberSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null

  const role = user.app_metadata?.role
  const signupIntent = user.user_metadata?.signup_intent
  if (role !== "member" && signupIntent !== "member") return null

  return { supabase, user, userId: user.id, userEmail: user.email }
}
