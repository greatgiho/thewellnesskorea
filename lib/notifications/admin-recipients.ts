import { createServiceClient } from "@/lib/supabase/service"

function isAdminAuthUser(appMetadata: Record<string, unknown> | undefined): boolean {
  const role = appMetadata?.role
  return role !== "teacher"
}

/** All Supabase Auth users who can access /admin (role admin or unset, not teacher). */
export async function getAdminNotifyEmails(): Promise<string[]> {
  const admin = createServiceClient()
  const emails = new Set<string>()
  let page = 1
  const perPage = 200

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
    if (error) {
      console.error("[notify] listUsers failed:", error.message)
      return []
    }

    for (const user of data.users) {
      if (!user.email) continue
      if (!isAdminAuthUser(user.app_metadata as Record<string, unknown>)) {
        continue
      }
      emails.add(user.email.trim().toLowerCase())
    }

    if (data.users.length < perPage) break
    page += 1
  }

  return [...emails]
}
