import { siteOrigin } from "@/lib/apply/config"
import type { PartnerRegistrationStatus } from "@/lib/partners/types"
import { getAdminNotifyEmails } from "@/lib/notifications/admin-recipients"

type ProfileSubmittedPayload = {
  personId: string
  nameKo: string
  nameEn: string
  email: string | null
  kind: string
  previousStatus: PartnerRegistrationStatus
}

function editUrl(personId: string): string {
  return `${siteOrigin()}/admin/partners/${personId}/edit`
}

export async function notifyAdminProfileSubmitted(
  payload: ProfileSubmittedPayload,
): Promise<void> {
  const isResubmission = payload.previousStatus !== "draft"
  const label = isResubmission ? "재제출" : "신규 제출"
  const subject = `[TWK] 프로필 검토 요청: ${payload.nameKo} (${label})`
  const editLink = editUrl(payload.personId)

  const lines = [
    `프로필 검토 요청 (${label})`,
    ``,
    `이름: ${payload.nameKo} (${payload.nameEn})`,
    `이메일: ${payload.email ?? "—"}`,
    `유형: ${payload.kind}`,
    ``,
    `검토: ${editLink}`,
  ]

  await Promise.allSettled([
    sendResendEmail(subject, lines.join("\n"), editLink),
    sendSlackMessage(payload, label, editLink),
  ])
}

async function sendResendEmail(
  subject: string,
  text: string,
  editLink: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM_EMAIL
  if (!apiKey || !from) return

  const to = await getAdminNotifyEmails()
  if (to.length === 0) return

  const html = `
    <p>${text.replace(/\n/g, "<br>")}</p>
    <p><a href="${editLink}">어드민에서 검토하기</a></p>
  `

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
    }),
  })
}

async function sendSlackMessage(
  payload: ProfileSubmittedPayload,
  label: string,
  editLink: string,
): Promise<void> {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) return

  const text = [
    `🟡 *프로필 검토 요청* (${label})`,
    `• 이름: ${payload.nameKo} (${payload.nameEn})`,
    `• 이메일: ${payload.email ?? "—"}`,
    `• 유형: ${payload.kind}`,
    `• <${editLink}|검토하기>`,
  ].join("\n")

  await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  })
}

export function applyLinkForTeachers(): string {
  return `${siteOrigin()}/apply`
}
