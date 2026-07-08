import type { Metadata } from "next"
import Link from "next/link"
import { TrueLoginForm } from "@/components/account/true-login-form"

export const metadata: Metadata = {
  title: "Sign in — The Wellness Korea",
  description: "Sign in with your email and password to manage your reservations.",
}

export default function TrueLoginPage() {
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
            이메일과 비밀번호로 로그인합니다.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <TrueLoginForm />
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
