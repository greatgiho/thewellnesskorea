import type { Metadata } from "next"
import { requireAdminSession } from "@/lib/auth/require-session"
import { getSiteSettings, toColumnValues } from "@/lib/site/settings"
import { SettingsFieldsForm } from "@/components/admin/settings-fields-form"
import {
  BUSINESS_INFO_FIELDS,
  SITE_INFO_FIELDS,
} from "@/components/admin/settings-fields"
import { ChangePasswordForm } from "@/components/admin/change-password-form"

export const metadata: Metadata = {
  title: "설정 — Admin",
}

export default async function AdminSettingsPage() {
  const { userEmail } = await requireAdminSession()
  const values = toColumnValues(await getSiteSettings())

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-foreground">설정</h1>
        {userEmail ? (
          <p className="mt-2 text-sm text-muted-foreground">{userEmail}</p>
        ) : null}
      </div>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">사이트 정보</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          사이트 하단에 표시됩니다. 저장하면 바로 반영됩니다.
        </p>
        <div className="mt-6">
          <SettingsFieldsForm
            fields={SITE_INFO_FIELDS}
            values={values}
            saved="사이트 정보를 저장했습니다."
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">사업자 정보</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          사이트 하단에 표시됩니다. 모두 비우면 표시되지 않습니다.
        </p>
        <div className="mt-6">
          <SettingsFieldsForm
            fields={BUSINESS_INFO_FIELDS}
            values={values}
            saved="사업자 정보를 저장했습니다."
          />
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <h2 className="font-serif text-xl text-foreground">비밀번호 변경</h2>
        <div className="mt-6">
          <ChangePasswordForm email={userEmail ?? ""} />
        </div>
      </section>
    </div>
  )
}
