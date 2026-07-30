import type { Metadata } from "next"
import Link from "next/link"
import { MemberLoginForm } from "@/components/account/member-login-form"
import { GoogleSignInButton } from "@/components/account/google-signin-button"

export const metadata: Metadata = {
  title: "Sign in — The Wellness Korea",
  description: "Sign in with an email link or Google to manage your reservations.",
}

export default function MemberSignInPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <Link
            href="/"
            className="font-serif text-2xl text-foreground transition-opacity hover:opacity-70"
          >
            The Wellness Korea
          </Link>
          <p className="mt-3 font-mono text-xs uppercase tracking-[0.35em] text-primary">
            Member
          </p>
          <h1 className="mt-4 font-serif text-3xl font-light text-foreground">
            Sign in
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이메일 링크 또는 Google로 로그인합니다.
          </p>
        </div>

        <div className="space-y-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <MemberLoginForm />
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            또는
            <span className="h-px flex-1 bg-border" />
          </div>
          <GoogleSignInButton />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  )
}
