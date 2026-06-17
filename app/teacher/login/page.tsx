import Link from "next/link"
import { TeacherLoginForm } from "@/components/teacher/teacher-login-form"

export default function TeacherLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
          <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Teacher
          </h1>
        </div>
        <TeacherLoginForm />
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            사이트로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  )
}
