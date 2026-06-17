import Link from "next/link"
import { ChangePasswordForm } from "@/components/teacher/change-password-form"
import { PasswordReissueButton } from "@/components/teacher/password-reissue-button"

export default function TeacherSettingsPage() {
  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">설정</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          계정 및 비밀번호를 관리합니다.
        </p>
      </div>

      <section className="space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="font-medium text-foreground">비밀번호 변경</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card/40 p-6">
        <h2 className="font-medium text-foreground">임시 비밀번호 재발급</h2>
        <PasswordReissueButton />
      </section>

      <p className="text-center text-sm text-muted-foreground">
        <Link href="/teacher" className="underline-offset-4 hover:underline">
          ← 스케줄로 돌아가기
        </Link>
      </p>
    </div>
  )
}
