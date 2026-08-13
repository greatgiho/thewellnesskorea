import { siteOrigin } from "@/lib/site-origin"
import type { PartnerRegistrationStatus } from "@/lib/partners/types"
import { getAdminNotifyEmails } from "@/lib/notifications/admin-recipients"
import { sendEmail } from "@/lib/notifications/email"

type ProfileSubmittedPayload = {
  personId: string
  nameKo: string
  nameEn: string
  email: string | null
  kind: string
  previousStatus: PartnerRegistrationStatus
}

function editUrl(personId: string): string {
  return `${siteOrigin()}/a/partners/${personId}/edit`
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
    sendAdminEmail(subject, lines.join("\n"), editLink),
    sendSlackMessage(payload, label, editLink),
  ])
}

async function sendAdminEmail(
  subject: string,
  text: string,
  editLink: string,
): Promise<void> {
  const to = await getAdminNotifyEmails()
  if (to.length === 0) return

  const html = `
    <p>${text.replace(/\n/g, "<br>")}</p>
    <p><a href="${editLink}">어드민에서 검토하기</a></p>
  `

  // One request per admin, not one request with every admin in it. sendEmail
  // puts the whole list in a single Brevo call and throws if the call fails,
  // so a single unreachable address would have silenced the alert for everyone
  // else — and admin addresses are exactly where a dead one can sit unnoticed,
  // since admins sign in with a password and never need to receive mail.
  const results = await Promise.allSettled(
    to.map((address) => sendEmail(address, subject, html, "admin-alert")),
  )

  const failed = results.filter((r) => r.status === "rejected").length
  if (failed > 0) {
    console.error(
      `[admin-alert] ${failed}/${to.length} recipients failed; the rest were sent`,
    )
  }
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
