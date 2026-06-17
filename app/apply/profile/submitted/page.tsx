import Link from "next/link"

export default function ApplyProfileSubmittedPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h1 className="font-serif text-2xl text-foreground">제출이 완료되었습니다</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            검토 후 연락드리겠습니다.
            <br />
            승인 전까지 홈페이지에는 노출되지 않습니다.
          </p>
        </div>
        <Link
          href="/apply/profile"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          프로필 다시 보기
        </Link>
      </div>
    </div>
  )
}
