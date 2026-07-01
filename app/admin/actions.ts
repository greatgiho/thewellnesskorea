"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { requireAdminSession } from "@/lib/auth/require-session"
import { isUserFacingError } from "@/lib/errors"
import { persistPartner } from "@/lib/partners/persist-partner"
import type { PartnerFormInput } from "@/lib/partners/types"

function revalidatePartnerCaches(isPublished: boolean, personId?: string, slug?: string) {
  revalidatePath("/admin/partners")
  if (personId) revalidatePath(`/admin/partners/${personId}/edit`)
  if (isPublished) revalidatePath("/")
  if (slug) revalidatePath(`/partners/${slug}`)
}

export type SavePersonOptions = {
  newPersonId?: string
  photoPath?: string | null
}

export type PartnerSaveResult =
  | { ok: true; personId: string }
  | { ok: false; error: string }

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/admin/login")
}

export async function savePartner(
  input: PartnerFormInput,
  personId?: string,
  options?: SavePersonOptions,
): Promise<PartnerSaveResult> {
  try {
    const { supabase } = await requireAdminSession()
    const result = await persistPartner(supabase, input, {
      mode: "admin",
      personId,
      options,
    })
    revalidatePartnerCaches(result.isPublished, result.personId, result.slug)
    return { ok: true, personId: result.personId }
  } catch (error) {
    if (isUserFacingError(error) || error instanceof Error) {
      return {
        ok: false,
        error: error.message || "저장에 실패했습니다.",
      }
    }
    console.error("[savePartner]", error)
    return { ok: false, error: "저장에 실패했습니다. 잠시 후 다시 시도해 주세요." }
  }
}

export async function createPerson(input: PartnerFormInput) {
  return savePartner(input)
}

export async function updatePerson(id: string, input: PartnerFormInput) {
  return savePartner(input, id)
}

export async function updatePersonPhotoPath(id: string, photoPath: string) {
  const { supabase } = await requireAdminSession()

  const { data: existing } = await supabase
    .from("partners")
    .select("photo_path, is_published")
    .eq("id", id)
    .maybeSingle()

  const { error } = await supabase
    .from("partners")
    .update({ photo_path: photoPath })
    .eq("id", id)

  if (error) throw new Error(error.message)

  const oldPath = existing?.photo_path
  if (oldPath && oldPath !== photoPath) {
    await supabase.storage.from("person-photos").remove([oldPath])
  }

  revalidatePartnerCaches(existing?.is_published ?? false, id)
}

export type PartnerAccountResult =
  | { ok: true; isNew: boolean }
  | { ok: false; error: string }

/**
 * 파트너(선생님) Auth 계정 생성 또는 비밀번호 재발급.
 * - 계정이 없으면 신규 생성 + partners.user_id 연결
 * - 이미 있으면 임시 비밀번호 재발급
 */
export async function provisionPartnerAccount(
  personId: string,
): Promise<PartnerAccountResult> {
  try {
    await requireAdminSession()
    const service = createServiceClient()

    const { data: partner, error: loadError } = await service
      .from("partners")
      .select("id, email, user_id, name_ko")
      .eq("id", personId)
      .maybeSingle()

    if (loadError) throw new Error(loadError.message)
    if (!partner?.email?.trim()) {
      throw new Error("이메일을 먼저 입력해 주세요.")
    }

    const email = partner.email.trim()
    const tempPassword = generateTempPassword()
    let isNew = false

    if (partner.user_id) {
      // 기존 계정 — 비밀번호만 재설정
      const { error } = await service.auth.admin.updateUserById(partner.user_id, {
        password: tempPassword,
      })
      if (error) throw new Error(error.message)
    } else {
      // 신규 계정 생성
      const { data: created, error: createError } = await service.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        app_metadata: { role: "teacher" },
        user_metadata: { name: partner.name_ko },
      })
      if (createError) throw new Error(createError.message)

      const { error: linkError } = await service
        .from("partners")
        .update({ user_id: created.user.id })
        .eq("id", personId)
      if (linkError) throw new Error(linkError.message)
      isNew = true
    }

    // 이메일 발송
    const partnerHost = process.env.NEXT_PUBLIC_PARTNER_HOST ?? "partner.thewellnesskorea.com"
    await sendPartnerCredentialsEmail({
      email,
      nameKo: partner.name_ko,
      tempPassword,
      loginUrl: `https://${partnerHost}/login`,
      isNew,
    })

    revalidatePath(`/admin/partners/${personId}/edit`)
    return { ok: true, isNew }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "계정 생성에 실패했습니다.",
    }
  }
}

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
  return Array.from({ length: 12 }, () =>
    chars[Math.floor(Math.random() * chars.length)],
  ).join("")
}

async function sendPartnerCredentialsEmail(opts: {
  email: string
  nameKo: string
  tempPassword: string
  loginUrl: string
  isNew: boolean
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM_EMAIL
  if (!apiKey || !from) return

  const subject = opts.isNew
    ? "[TWK] 파트너 포털 계정이 생성되었습니다"
    : "[TWK] 파트너 포털 임시 비밀번호"

  const html = `
    <p>${opts.nameKo} 선생님, 안녕하세요.</p>
    <p>${opts.isNew ? "파트너 포털 계정이 생성되었습니다." : "임시 비밀번호가 발급되었습니다."}</p>
    <ul>
      <li><strong>이메일:</strong> ${opts.email}</li>
      <li><strong>임시 비밀번호:</strong> <code>${opts.tempPassword}</code></li>
      <li><strong>로그인 주소:</strong> <a href="${opts.loginUrl}">${opts.loginUrl}</a></li>
    </ul>
    <p>로그인 후 비밀번호를 변경해 주세요.</p>
  `

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: [opts.email], subject, html }),
  })
}

export async function deletePartner(id: string) {
  const { supabase } = await requireAdminSession()

  const { count: sessionCount, error: sessionCountError } = await supabase
    .from("sessions")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", id)

  if (sessionCountError) throw new Error(sessionCountError.message)
  if (sessionCount && sessionCount > 0) {
    throw new Error(
      "Cannot delete: this instructor has scheduled sessions. Remove or reassign them first.",
    )
  }

  const { data: person } = await supabase
    .from("partners")
    .select("photo_path, is_published")
    .eq("id", id)
    .maybeSingle()

  if (person?.photo_path) {
    await supabase.storage.from("person-photos").remove([person.photo_path])
  }

  const { error } = await supabase.from("partners").delete().eq("id", id)
  if (error) throw new Error(error.message)

  revalidatePartnerCaches(person?.is_published ?? false)
}
