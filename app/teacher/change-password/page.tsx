import Link from "next/link"
import { ChangePasswordForm } from "@/components/teacher/change-password-form"

export default function TeacherChangePasswordPage() {
  return (
    <div className="mx-auto max-w-md space-y-8 py-8">
      <div className="text-center">
        <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
        <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
          비밀번호 변경
        </h1>
      </div>
      <ChangePasswordForm forced />
      <p className="text-center text-xs text-muted-foreground">
        <Link href="/teacher/login" className="underline-offset-4 hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  )
}
