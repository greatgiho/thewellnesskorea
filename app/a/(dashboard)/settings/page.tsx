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
        <p className="mt-2 text-sm text-muted-foreground">
          내 어드민 계정 설정입니다.
          {userEmail ? (
            <>
              {" "}
              지금 로그인한 계정은{" "}
              <span className="text-foreground">{userEmail}</span> 입니다.
            </>
          ) : null}
        </p>
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">비밀번호 변경</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          계정을 만들 때 전달받은 비밀번호를 쓰고 계신다면 바꿔 두세요. 어드민
          주소는 로그인 ID 로만 쓰이므로 이 주소로는 아무것도 발송되지 않고,
          비밀번호를 잊으면 되돌릴 방법이 없습니다.
        </p>
        <div className="mt-6">
          <ChangePasswordForm email={userEmail ?? ""} />
        </div>
      </section>
    </div>
  )
}
