import Link from "next/link"
import { teacherSignOut } from "@/app/teacher/actions"
import { getTeacherPartnerByUserId } from "@/lib/auth/teacher-account"
import { createClient } from "@/lib/supabase/server"

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const person = user ? await getTeacherPartnerByUserId(user.id) : null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <Link href="/teacher" className="font-serif text-xl text-foreground">
              My Schedule
            </Link>
            {person && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {person.name_ko} · {person.name_en}
              </p>
            )}
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/teacher/settings"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              설정
            </Link>
            <form action={teacherSignOut}>
              <button
                type="submit"
                className="text-muted-foreground transition-colors hover:text-foreground"
              >
                로그아웃
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}
