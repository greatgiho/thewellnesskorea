import { PartnerAcceptInviteForm } from "@/components/partner/partner-accept-invite-form"

export default async function PartnerAcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
          <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Set Your Password
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            파트너 포털에서 사용할 비밀번호를 설정해 주세요.
          </p>
        </div>
        <PartnerAcceptInviteForm token={token ?? ""} />
      </div>
    </div>
  )
}
