import type { Metadata } from "next"
import { MemberSignupForm } from "@/components/account/member-signup-form"
import { GoogleSignInButton } from "@/components/account/google-signin-button"
import { AuthPageFrame } from "@/components/account/auth-page-frame"

export const metadata: Metadata = {
  title: "Create account — The Wellness Korea",
  description: "Create a member account to manage your class reservations.",
}

type SignupPageProps = {
  searchParams: Promise<{ email?: string; name?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { email, name } = await searchParams

  return (
    <AuthPageFrame
      title="Create your account"
      description="Link past guest bookings automatically when you use the same email."
    >
      <MemberSignupForm defaultEmail={email ?? ""} defaultName={name ?? ""} />
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        또는
        <span className="h-px flex-1 bg-border" />
      </div>
      <GoogleSignInButton label="Google로 가입하기" />
    </AuthPageFrame>
  )
}
