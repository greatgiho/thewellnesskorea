import { Suspense } from "react"
import { PartnerLoginForm } from "@/components/partner/partner-login-form"

export default function PartnerLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
          <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Partner Portal
          </h1>
        </div>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <PartnerLoginForm />
        </Suspense>
      </div>
    </div>
  )
}
