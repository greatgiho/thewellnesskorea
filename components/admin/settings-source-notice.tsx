import type { ResolvedSettings } from "@/lib/site/settings-source"

/**
 * What the public site is actually showing right now, and where it came from.
 *
 * The forms below edit the database. Everything else in the chain — the
 * environment fallback, the built-in placeholders — is invisible from here, so
 * without this the two states that matter look identical to a filled-in form:
 * a fallback quietly carrying the site, and a malformed fallback that will not
 * carry it when the database goes down.
 *
 * The second one is the reason this exists. A typo in SITE_SETTINGS_FALLBACK
 * costs nothing until the day it is the only thing left, and that is the worst
 * possible day to find out.
 */

const SOURCE_LABEL = {
  database: "DB (어드민에서 입력한 값)",
  env: "환경변수 (SITE_SETTINGS_FALLBACK)",
  placeholder: "소스코드 기본값",
} as const

export function SettingsSourceNotice({
  resolved,
}: {
  resolved: ResolvedSettings
}) {
  const usingFallback = resolved.businessSource !== "database"

  return (
    <div
      className={`rounded-2xl border p-5 text-sm ${
        usingFallback
          ? "border-destructive/30 bg-destructive/5"
          : "border-border bg-card"
      }`}
    >
      <p className="text-foreground">
        지금 사이트에 표시 중인 출처
      </p>
      <dl className="mt-3 space-y-1.5 text-muted-foreground">
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">사업자 정보</dt>
          <dd>{SOURCE_LABEL[resolved.businessSource]}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-20 shrink-0">사이트 정보</dt>
          <dd>{SOURCE_LABEL[resolved.siteSource]}</dd>
        </div>
      </dl>

      {resolved.missingInDatabase.length > 0 ? (
        <p className="mt-3 text-muted-foreground">
          DB 에 비어 있는 필수 항목이 {resolved.missingInDatabase.length}개
          있습니다. 아래에서 채우면 이 줄이 사라집니다.
        </p>
      ) : null}

      {resolved.envError ? (
        <p className="mt-3 text-foreground">
          환경변수 <code>SITE_SETTINGS_FALLBACK</code> 를 읽지 못했습니다 —{" "}
          {resolved.envError} DB 가 비면 받아낼 것이 없는 상태입니다.
        </p>
      ) : null}
    </div>
  )
}
