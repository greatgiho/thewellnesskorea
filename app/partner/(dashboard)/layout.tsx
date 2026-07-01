import Link from "next/link"
import { partnerSignOut } from "@/app/partner/actions"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"

export default async function PartnerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { partner } = await requirePartnerSession()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <p className="font-serif text-xl text-foreground">Partner Portal</p>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/partner"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                클래스
              </Link>
              <Link
                href="/partner/history"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                수업 이력
              </Link>
              <Link
                href="/partner/profile"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                내 프로필
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{partner.name_ko}</span>
            <form action={partnerSignOut}>
              <button
                type="submit"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
