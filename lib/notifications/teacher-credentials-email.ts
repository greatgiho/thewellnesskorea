import { siteOrigin } from "@/lib/apply/config"
import { sendResendEmail } from "@/lib/notifications/resend"
import { renderTeacherCredentialsEmail } from "@/lib/notifications/email-templates"

type TeacherCredentialsPayload = {
  email: string
  nameKo: string
  tempPassword: string
  isReissue?: boolean
}

export async function sendTeacherCredentialsEmail(
  payload: TeacherCredentialsPayload,
): Promise<void> {
  const loginUrl = `${siteOrigin()}/teacher/login`
  const isReissue = payload.isReissue ?? false

  const html = await renderTeacherCredentialsEmail({
    nameKo: payload.nameKo,
    email: payload.email,
    tempPassword: payload.tempPassword,
    loginUrl,
    isReissue,
  })

  const subject = isReissue
    ? "[TWK] 임시 비밀번호가 재발급되었습니다"
    : "[TWK] 선생님 계정이 발급되었습니다"

  await sendResendEmail(payload.email, subject, html, "teacher-credentials")
}
