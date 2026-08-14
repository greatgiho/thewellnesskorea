import type { BusinessInfo } from "@/lib/site/settings"

/**
 * What production serves instead of the site when the trader details are not
 * configured anywhere.
 *
 * 전자상거래법 제10조 requires them on a cyber-mall's pages, so serving the
 * site without them is the failure — not this screen. The reasoning is the same
 * as seeding 056 empty: an invented registration number would be a false claim
 * about a real company, and this is what "no claim at all" has to look like
 * once money is involved.
 *
 * Names the missing fields, because "설정이 필요합니다" sends whoever finds it
 * looking through a settings page for what is already filled in.
 *
 * noindex: the response is a 200. A server component cannot set a status code
 * — Next commits one as soon as the shell streams — so keeping this out of the
 * index is what is actually available. React hoists the tag into <head>.
 */

const LABELS: Record<keyof BusinessInfo, string> = {
  businessName: "상호",
  representativeName: "대표자",
  businessNumber: "사업자등록번호",
  mailOrderNumber: "통신판매업 신고번호",
  address: "주소",
  phone: "전화번호",
  email: "이메일",
  privacyOfficer: "개인정보관리책임자",
}

export function SettingsRequiredScreen({
  missing,
}: {
  missing: (keyof BusinessInfo)[]
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <meta name="robots" content="noindex" />
      <div className="w-full max-w-lg">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Configuration required
        </p>
        <h1 className="mt-4 font-serif text-3xl text-foreground">
          사업자 정보가 설정되지 않았습니다
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          전자상거래법상 표시해야 하는 사업자 정보가 없어 사이트를 열지 않았습니다.
          어드민 → 설정 → 사업자 정보에서 입력하면 바로 정상으로 돌아옵니다.
        </p>

        {missing.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-border bg-card p-5">
            <p className="text-sm text-foreground">비어 있는 항목</p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              {missing.map((field) => (
                <li key={field}>· {LABELS[field]}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <a
          href="/a/settings"
          className="mt-8 inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          어드민에서 입력하기
        </a>
      </div>
    </main>
  )
}
