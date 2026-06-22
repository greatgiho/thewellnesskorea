import Link from "next/link"
import { signOut } from "@/app/admin/actions"

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/admin/partners" className="font-serif text-xl text-foreground">
              Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/partners"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Partners
              </Link>
              <Link
                href="/admin/schedule"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Schedule
              </Link>
              <Link
                href="/admin/bookings"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Bookings
              </Link>
              <Link
                href="/admin/journal"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Journal
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              View site
            </Link>
            <form action={signOut}>
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
      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}
