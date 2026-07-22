"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { requireAdminSession } from "@/lib/auth/require-session"
import { createServiceClient } from "@/lib/supabase/service"
import {
  VIEW_AS_COOKIE,
  VIEW_AS_COOKIE_MAX_AGE,
  encodeViewAs,
  type ViewAsKind,
} from "@/lib/view-as"

/**
 * Enter read-only view-as for a partner/member. Admin-only. Records an audit
 * entry, sets the signed cookie, and drops the admin into the target surface.
 */
export async function startViewAs(kind: ViewAsKind, id: string) {
  const { user } = await requireAdminSession()
  const service = createServiceClient()

  // Validate the target exists before impersonating.
  if (kind === "partner") {
    const { data } = await service
      .from("partners")
      .select("id")
      .eq("id", id)
      .maybeSingle()
    if (!data) redirect("/a/partners")
  } else {
    const { data } = await service.auth.admin.getUserById(id)
    if (!data?.user) redirect("/a/members")
  }

  const cookie = await encodeViewAs({ kind, id, adminUserId: user.id })
  const store = await cookies()
  store.set(VIEW_AS_COOKIE, cookie, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: VIEW_AS_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  })

  await service
    .from("view_as_audit")
    .insert({ admin_user_id: user.id, target_kind: kind, target_id: id })

  redirect(kind === "partner" ? "/p" : "/u")
}

/** Leave view-as and return to the admin area. */
export async function exitViewAs() {
  const store = await cookies()
  store.delete(VIEW_AS_COOKIE)
  redirect("/a")
}
