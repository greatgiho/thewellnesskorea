import type { SupabaseClient, User } from "@supabase/supabase-js"
import { UserFacingError } from "@/lib/errors"
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

  // Service client: admin-precreated rows have email but no user_id; RLS hides them from teachers.
  const admin = createServiceClient()
  const { data: byEmail, error: byEmailError } = await admin
    .from("partners")
    .select("*")
    .ilike("email", email)
    .maybeSingle()

  if (byEmailError) throw new Error(byEmailError.message)

  if (byEmail) {
    if (byEmail.user_id && byEmail.user_id !== user.id) {
      throw new UserFacingError(
        "이 이메일은 다른 계정에 연결되어 있습니다. 관리자에게 문의해 주세요.",
      )
    }
    const { data: linked, error: linkError } = await admin
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
