import { createServiceClient } from "@/lib/supabase/service"

function isAdminAuthUser(appMetadata: Record<string, unknown> | undefined): boolean {
  return appMetadata?.role === "admin"
}

/** All Supabase Auth users with app_metadata.role = admin (admin notify recipients). */
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
