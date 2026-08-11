import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { ChangePasswordForm } from "@/components/admin/change-password-form"

export const metadata: Metadata = {
  title: "설정 — Admin",
}

export default async function AdminSettingsPage() {
  const { userEmail } = await requireAdminSession()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">설정</h1>
        {userEmail ? (
          <p className="mt-2 text-sm text-muted-foreground">{userEmail}</p>
        ) : null}
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">비밀번호 변경</h2>
        <div className="mt-6">
          <ChangePasswordForm email={userEmail ?? ""} />
        </div>
      </section>
    </div>
  )
}
