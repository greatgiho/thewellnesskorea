import type { Metadata } from "next"
import Link from "next/link"
import { MemberSignupForm } from "@/components/account/member-signup-form"

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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Link past guest bookings automatically when you use the same email.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <MemberSignupForm
            defaultEmail={email ?? ""}
            defaultName={name ?? ""}
          />
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
