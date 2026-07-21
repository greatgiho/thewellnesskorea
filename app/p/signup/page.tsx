import { PartnerSignupForm } from "@/components/partner/partner-signup-form"

export default function PartnerSignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
          <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Partner Sign-up
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            파트너로 활동을 신청합니다. 관리자 승인 후 포털에 로그인할 수 있습니다.
          </p>
        </div>
        <PartnerSignupForm />
      </div>
    </div>
  )
}
