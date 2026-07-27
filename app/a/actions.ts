"use server"

import { randomBytes, createHash } from "crypto"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/service"
import { requireAdminSession } from "@/lib/auth/require-session"
import { isUserFacingError } from "@/lib/errors"
import { sendEmail } from "@/lib/notifications/email"
import { siteOrigin } from "@/lib/site-origin"
import { persistPartner } from "@/lib/partners/persist-partner"
import type { PartnerFormInput } from "@/lib/partners/types"

function revalidatePartnerCaches(isPublished: boolean, personId?: string, slug?: string) {
  revalidatePath("/a/partners")
  if (personId) revalidatePath(`/a/partners/${personId}/edit`)
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
  redirect("/a/signin")
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

/**
 * Approve or reject a self-registered partner (registration_status "submitted").
 * Approving unblocks portal login (canAccessPartnerPortal allows "approved").
 * Runs under the admin's own client — the "admin all" RLS grants the update.
 */
export async function setPartnerRegistrationStatus(
  id: string,
  status: "approved" | "rejected",
): Promise<PartnerSaveResult> {
  try {
    const { supabase, userId } = await requireAdminSession()
    const { data: updated, error } = await supabase
      .from("partners")
      .update({
        registration_status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: userId,
      })
      .eq("id", id)
      .select("email, name_ko")
      .maybeSingle()
    if (error) throw new Error(error.message)

    // Notify the partner on approval so they know they can sign in. Best-effort:
    // a mail failure must not fail the approval itself.
    if (status === "approved" && updated?.email) {
      try {
        const url = `${siteOrigin()}/p/signin`
        const name = updated.name_ko?.trim() || "파트너"
        await sendEmail(
          updated.email,
          "The Wellness Korea — 파트너 가입이 승인되었습니다",
          `<p>${name}님, 파트너 가입이 승인되었습니다.</p>` +
            `<p>아래에서 로그인하시면 파트너 포털을 이용하실 수 있습니다.</p>` +
            `<p><a href="${url}">${url}</a></p>`,
          "partner-approved",
        )
      } catch (mailErr) {
        console.error(
          "[setPartnerRegistrationStatus] approval email failed:",
          mailErr,
        )
      }
    }

    revalidatePath("/a/partners")
    revalidatePath(`/a/partners/${id}`)
    return { ok: true, personId: id }
  } catch (error) {
    if (isUserFacingError(error) || error instanceof Error) {
      return { ok: false, error: error.message || "처리에 실패했습니다." }
    }
    console.error("[setPartnerRegistrationStatus]", error)
    return { ok: false, error: "처리에 실패했습니다. 잠시 후 다시 시도해 주세요." }
  }
}

export async function approvePartner(id: string): Promise<void> {
  await setPartnerRegistrationStatus(id, "approved")
}

export async function rejectPartner(id: string): Promise<void> {
  await setPartnerRegistrationStatus(id, "rejected")
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

const INVITE_TTL_DAYS = 7

/**
 * 파트너(선생님) 초대. 임시 비밀번호 대신 토큰이 담긴 초대 링크를 이메일로 보냄.
 * - 계정이 없으면 신규 Auth 계정 생성(비밀번호 미설정) + partners.user_id 연결
 * - 이미 있으면 기존 계정에 초대 링크 재발급
 * 파트너는 링크를 열어 본인 비밀번호를 직접 설정한다.
 */
export async function provisionPartnerAccount(
  personId: string,
): Promise<PartnerAccountResult> {
  try {
    await requireAdminSession()
    const service = createServiceClient()

    const { data: infoRows, error: infoError } = await service.rpc(
      "get_partner_account_info",
      { p_person_id: personId },
    )
    if (infoError) throw new Error(infoError.message)
    const partner = infoRows?.[0]
    if (!partner?.email?.trim()) {
      throw new Error("이메일을 먼저 입력해 주세요.")
    }

    const email = partner.email.trim()
    let userId = partner.user_id as string | null
    let isNew = false

    if (!userId) {
      // 신규 계정 — 비밀번호 없이 생성(초대 수락 시 파트너가 설정)
      const { data: created, error: createError } = await service.auth.admin.createUser({
        email,
        email_confirm: true,
        app_metadata: { role: "partner" },
        user_metadata: { name: partner.name_ko },
      })
      if (createError) throw new Error(createError.message)
      userId = created.user.id
      isNew = true
    }

    // 단일 사용 초대 토큰: 원문은 링크로만 전달, DB엔 SHA-256 해시만 저장
    const rawToken = randomBytes(32).toString("base64url")
    const tokenHash = createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(
      Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString()

    const { error: setError } = await service.rpc("set_partner_invite", {
      p_person_id: personId,
      p_user_id: userId,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt,
    })
    if (setError) throw new Error(setError.message)

    const siteUrl = (
      process.env.NEXT_PUBLIC_SITE_URL ?? "https://thewellnesskorea.com"
    ).replace(/\/$/, "")
    await sendPartnerInviteEmail({
      email,
      nameKo: partner.name_ko,
      inviteUrl: `${siteUrl}/p/accept-invite?token=${rawToken}`,
      isNew,
    })

    revalidatePath(`/a/partners/${personId}/edit`)
    return { ok: true, isNew }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "초대 발송에 실패했습니다.",
    }
  }
}

async function sendPartnerInviteEmail(opts: {
  email: string
  nameKo: string
  inviteUrl: string
  isNew: boolean
}): Promise<void> {
  const subject = "[TWK] 파트너 포털 초대 — 비밀번호를 설정해 주세요"
  const html = `
    <p>${opts.nameKo} 선생님, 안녕하세요.</p>
    <p>파트너 포털 계정 초대가 도착했습니다. 아래 버튼을 눌러 비밀번호를 설정하면 로그인할 수 있습니다.</p>
    <p style="margin:24px 0">
      <a href="${opts.inviteUrl}"
         style="display:inline-block;padding:12px 20px;background:#111;color:#fff;border-radius:8px;text-decoration:none">
        비밀번호 설정하기
      </a>
    </p>
    <p style="color:#666;font-size:13px">버튼이 안 되면 아래 주소를 브라우저에 붙여넣어 주세요:<br>
      <a href="${opts.inviteUrl}">${opts.inviteUrl}</a></p>
    <p style="color:#666;font-size:13px">이 링크는 ${INVITE_TTL_DAYS}일간 유효하며 한 번만 사용할 수 있습니다.</p>
  `
  await sendEmail(opts.email, subject, html, "partner-invite")
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
