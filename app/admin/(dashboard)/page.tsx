export default function AdminHomePage() {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-widest text-primary">
        Admin
      </p>
      <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
        백오피스 대시보드
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        좌측 메뉴에서 회원관리 · 결제 · 정산 승인 및 운영(스케줄/저널/대기자)에
        접근합니다. 일부 항목은 스켈레톤(준비 중)입니다.
      </p>
    </div>
  )
}
