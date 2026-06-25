import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireAdminSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  if (user.app_metadata?.role !== "admin") redirect("/admin/login")
  return { supabase, user, userId: user.id, userEmail: user.email }
}

export async function requireTeacherSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/apply")
  if (!user.email) throw new Error("Email is required on your account.")
  return { supabase, user }
}

export async function requireMemberSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  if (!user.email) throw new Error("Email is required on your account.")

  const role = user.app_metadata?.role
  const signupIntent = user.user_metadata?.signup_intent
  if (role === "teacher") redirect("/teacher")
  if (role !== "member" && signupIntent !== "member") redirect("/")

  return { supabase, user, userId: user.id, userEmail: user.email }
}

export async function getOptionalMemberSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) return null

  const role = user.app_metadata?.role
  if (role === "teacher") return null

  const signupIntent = user.user_metadata?.signup_intent
  if (role !== "member" && signupIntent !== "member") return null

  return { supabase, user, userId: user.id, userEmail: user.email }
}
