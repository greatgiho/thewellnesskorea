import { siteOrigin } from "@/lib/apply/config"

type TeacherCredentialsPayload = {
  email: string
  nameKo: string
  tempPassword: string
  isReissue?: boolean
}

function teacherLoginUrl(): string {
  return `${siteOrigin()}/teacher/login`
}

async function sendResendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFY_FROM_EMAIL
  if (!apiKey || !from) {
    console.warn("[teacher-email] RESEND_API_KEY or NOTIFY_FROM_EMAIL missing")
    return
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[teacher-email] send failed:", res.status, body)
    throw new Error("Failed to send teacher credentials email.")
  }
}

export async function sendTeacherCredentialsEmail(
  payload: TeacherCredentialsPayload,
): Promise<void> {
  const loginUrl = teacherLoginUrl()
  const isReissue = payload.isReissue ?? false

  const subject = isReissue
    ? "[TWK] 임시 비밀번호가 재발급되었습니다"
    : "[TWK] 선생님 계정이 발급되었습니다"

  const intro = isReissue
    ? `${payload.nameKo}님, 요청하신 임시 비밀번호입니다.`
    : `${payload.nameKo}님, The Wellness Korea 선생님 개인 페이지 계정이 발급되었습니다.`

  const html = `
    <p>${intro}</p>
    <ul>
      <li><strong>로그인 주소:</strong> <a href="${loginUrl}">${loginUrl}</a></li>
      <li><strong>아이디(이메일):</strong> ${payload.email}</li>
      <li><strong>임시 비밀번호:</strong> ${payload.tempPassword}</li>
    </ul>
    <p>보안을 위해 첫 로그인 후 비밀번호를 변경해 주세요.</p>
  `

  await sendResendEmail(payload.email, subject, html)
}
