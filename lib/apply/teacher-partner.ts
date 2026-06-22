import type { SupabaseClient, User } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import type { PartnerRow } from "@/lib/partners/types"

export async function ensureTeacherRole(userId: string) {
  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error || !data.user) return
  if (data.user.app_metadata?.role === "admin") return

  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { ...data.user.app_metadata, role: "teacher" },
  })
}

export async function linkTeacherPartner(
  supabase: SupabaseClient,
  user: User,
): Promise<PartnerRow | null> {
  if (!user.email) return null

  await ensureTeacherRole(user.id)
  const email = user.email.trim().toLowerCase()

  const { data: byUser, error: byUserError } = await supabase
    .from("partners")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (byUserError) throw new Error(byUserError.message)
  if (byUser) return byUser as PartnerRow

  const { data: byEmail, error: byEmailError } = await supabase
    .from("partners")
    .select("*")
    .ilike("email", email)
    .maybeSingle()

  if (byEmailError) throw new Error(byEmailError.message)

  if (byEmail) {
    if (byEmail.user_id && byEmail.user_id !== user.id) {
      throw new Error(
        "This email is linked to another account. Please contact the admin.",
      )
    }
    const { data: linked, error: linkError } = await supabase
      .from("partners")
      .update({ user_id: user.id })
      .eq("id", byEmail.id)
      .select("*")
      .single()

    if (linkError) throw new Error(linkError.message)
    return linked as PartnerRow
  }

  return null
}
