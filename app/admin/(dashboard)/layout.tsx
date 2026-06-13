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
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/people" className="font-serif text-xl text-foreground">
              Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/people"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                People
              </Link>
              <Link
                href="/admin/schedule"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                Schedule
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
      <main className="mx-auto max-w-[1400px] px-6 py-10">{children}</main>
    </div>
  )
}
