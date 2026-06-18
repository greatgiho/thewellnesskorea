import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export async function requireAdminSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
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
