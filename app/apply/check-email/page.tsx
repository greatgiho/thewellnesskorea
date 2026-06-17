import Link from "next/link"

type Props = {
  searchParams: Promise<{ email?: string }>
}

export default async function ApplyCheckEmailPage({ searchParams }: Props) {
  const { email } = await searchParams

  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto w-full max-w-md space-y-6 text-center">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <p className="text-3xl" aria-hidden>
            ✉️
          </p>
          <h1 className="mt-4 font-serif text-2xl text-foreground">
            메일을 확인해 주세요
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            {email ? (
              <>
                <span className="font-medium text-foreground">{email}</span>
                <br />
                으로 로그인 링크를 보냈습니다.
              </>
            ) : (
              "이메일로 로그인 링크를 보냈습니다."
            )}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            메일의 링크를 눌러 프로필 작성을 이어가 주세요.
          </p>
        </div>
        <Link
          href="/apply"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          처음으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
