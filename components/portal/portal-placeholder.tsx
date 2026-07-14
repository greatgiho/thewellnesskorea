/**
 * 스켈레톤 더미 페이지 본문. 아직 미구현인 기능의 자리 + 대표 요구사항을 표시해
 * 개발자가 "여기에 무엇을 만들지"를 바로 파악하도록 한다.
 */
export function PortalPlaceholder({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow?: string
  title: string
  description: string
  items?: string[]
}) {
  return (
    <div className="max-w-3xl">
      <span className="inline-flex rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        스켈레톤 · 준비 중
      </span>
      {eyebrow ? (
        <p className="mt-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mt-2 font-serif text-2xl font-light text-foreground">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      {items && items.length > 0 ? (
        <ul className="mt-6 space-y-2">
          {items.map((it) => (
            <li
              key={it}
              className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground"
            >
              {it}
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-6 text-xs text-muted-foreground/70">
        ※ 실제 기능은 미구현입니다. 좌측 메뉴 구조/이 설명을 참고해 개발합니다.
      </p>
    </div>
  )
}
