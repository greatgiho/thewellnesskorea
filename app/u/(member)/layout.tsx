import { completeMemberOnboarding } from "@/lib/auth/member-account"
import { requireMemberSession } from "@/lib/auth/require-session"
import { ViewAsBanner } from "@/components/view-as-banner"
import { PublicShell } from "@/components/redesign/public-shell"

/**
 * The member area sits inside the public chrome rather than carrying its own.
 *
 * It used to render a thin header of its own: wordmark, a Schedule link, and a
 * sign-out button. All three are in SiteNav now — including sign-out, which the
 * nav does client-side and follows with a hard navigation so server components
 * re-render without the session cookie.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, viewAs } = await requireMemberSession()
  // Skip onboarding side-effects while an admin is impersonating (read-only).
  const { linkedBookingCount } = viewAs
    ? { linkedBookingCount: 0 }
    : await completeMemberOnboarding(user)

  return (
    <PublicShell banner={<ViewAsBanner />}>
      <main className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
        {linkedBookingCount > 0 ? (
          <p className="mb-8 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
            We linked {linkedBookingCount} past reservation
            {linkedBookingCount === 1 ? "" : "s"} to your account.
          </p>
        ) : null}
        {children}
      </main>
    </PublicShell>
  )
}
