import { Suspense } from "react"
import { ApplyLoginForm } from "@/components/apply/apply-login-form"

export default function ApplyPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            The Wellness Korea
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
            선생님 프로필 등록
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Brickwell Seochon 가이드·아티스트 프로필을 등록해 주세요.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <ApplyLoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
