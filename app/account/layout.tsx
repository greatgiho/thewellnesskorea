import Link from "next/link"
import { signOutMember } from "@/app/account/actions"
import { completeMemberOnboarding } from "@/lib/auth/member-account"
import { requireMemberSession } from "@/lib/auth/require-session"

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = await requireMemberSession()
  const { linkedBookingCount } = await completeMemberOnboarding(user)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-6">
          <Link
            href="/"
            className="font-serif text-xl text-foreground transition-opacity hover:opacity-70"
          >
            The Wellness Korea
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/#schedule"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Schedule
            </Link>
            <form action={signOutMember}>
              <button
                type="submit"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        {linkedBookingCount > 0 ? (
          <p className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            We linked {linkedBookingCount} past reservation
            {linkedBookingCount === 1 ? "" : "s"} to your account.
          </p>
        ) : null}
        {children}
      </main>
    </div>
  )
}
