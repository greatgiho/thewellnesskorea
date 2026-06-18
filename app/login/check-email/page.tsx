import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Check your email — The Wellness Korea",
}

type CheckEmailPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function LoginCheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const { email } = await searchParams

  return (
    <div className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
          <p className="text-3xl" aria-hidden>✉️</p>
          <h1 className="mt-4 font-serif text-2xl text-foreground">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {email ? (
              <>
                We sent a sign-in link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
              </>
            ) : (
              "We sent a sign-in link to your email."
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Open the link to access your reservations. The link expires after a
            short time.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
