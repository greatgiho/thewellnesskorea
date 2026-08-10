import type { Metadata } from "next"
import { MemberLoginForm } from "@/components/account/member-login-form"
import { GoogleSignInButton } from "@/components/account/google-signin-button"
import { AuthPageFrame } from "@/components/account/auth-page-frame"

export const metadata: Metadata = {
  title: "Sign in — The Wellness Korea",
  description: "Sign in with an email link or Google to manage your reservations.",
}

export default function MemberSignInPage() {
  return (
    <AuthPageFrame
      title="Sign in"
      description="이메일 링크 또는 Google로 로그인합니다."
    >
      <MemberLoginForm />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleSignInButton />
    </AuthPageFrame>
  )
}
