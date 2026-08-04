"use server"

import { revalidatePath } from "next/cache"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { assertNotViewAs } from "@/lib/view-as-server"

export type PostResult = { ok: true } | { ok: false; error: string }

export async function createSessionPost(
  sessionId: string,
  content: string,
): Promise<PostResult> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false, error: "Please write something first." }

  try {
    await assertNotViewAs()
    const { supabase, partner } = await requirePartnerSession()

    // 본인 세션이며 종료된 경우에만 허용
    const { data: session } = await supabase
      .from("sessions")
      .select("ends_at, instructor_id")
      .eq("id", sessionId)
      .maybeSingle()

    if (!session || session.instructor_id !== partner.id) {
      return { ok: false, error: "You don't have permission to do that." }
    }
    if (new Date(session.ends_at) > new Date()) {
      return {
        ok: false,
        error: "You can only post after the session has ended.",
      }
    }

    const { error } = await supabase.from("session_posts").insert({
      session_id: sessionId,
      author_type: "teacher",
      partner_id: partner.id,
      author_name: partner.name_ko,
      content: trimmed,
    })

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/p/sessions/${sessionId}/board`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Failed to post." }
  }
}

export async function deleteSessionPost(
  sessionId: string,
  postId: string,
): Promise<PostResult> {
  try {
    await assertNotViewAs()
    const { supabase, partner } = await requirePartnerSession()

    const { error } = await supabase
      .from("session_posts")
      .delete()
      .eq("id", postId)
      .eq("partner_id", partner.id)

    if (error) return { ok: false, error: error.message }

    revalidatePath(`/p/sessions/${sessionId}/board`)
    return { ok: true }
  } catch {
    return { ok: false, error: "Failed to delete." }
  }
}
