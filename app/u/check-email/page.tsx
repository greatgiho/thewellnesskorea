import type { Metadata } from "next"
import Link from "next/link"
import { AuthPageFrame } from "@/components/account/auth-page-frame"

export const metadata: Metadata = {
  title: "Check your email — The Wellness Korea",
}

type CheckEmailPageProps = {
  searchParams: Promise<{ email?: string }>
}

export default async function MemberCheckEmailPage({
  searchParams,
}: CheckEmailPageProps) {
  const { email } = await searchParams

  return (
    <AuthPageFrame
      title="Check your email"
      description={
        email ? (
          <>
            We sent a sign-in link to{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        ) : (
          "We sent a sign-in link to your email."
        )
      }
      footer={
        <Link href="/u/signin" className="underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      }
    >
      <p className="text-center text-3xl" aria-hidden>
        ✉️
      </p>
      <p className="text-center text-sm leading-relaxed text-muted-foreground text-pretty">
        Open the link to access your reservations. The link expires after a
        short time.
      </p>
    </AuthPageFrame>
  )
}
