"use server"

import { revalidatePath } from "next/cache"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"

export type PostResult = { ok: true } | { ok: false; error: string }

export async function createSessionPost(
  sessionId: string,
  content: string,
): Promise<PostResult> {
  const trimmed = content.trim()
  if (!trimmed) return { ok: false, error: "내용을 입력해 주세요." }

  try {
    const { supabase, partner } = await requirePartnerSession()

    // 본인 세션이며 종료된 경우에만 허용
    const { data: session } = await supabase
      .from("sessions")
      .select("ends_at, instructor_id")
      .eq("id", sessionId)
      .maybeSingle()

    if (!session || session.instructor_id !== partner.id) {
      return { ok: false, error: "권한이 없습니다." }
    }
    if (new Date(session.ends_at) > new Date()) {
      return { ok: false, error: "수업 종료 후에만 작성할 수 있습니다." }
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
    return { ok: false, error: "작성에 실패했습니다." }
  }
}

export async function deleteSessionPost(
  sessionId: string,
  postId: string,
): Promise<PostResult> {
  try {
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
    return { ok: false, error: "삭제에 실패했습니다." }
  }
}
