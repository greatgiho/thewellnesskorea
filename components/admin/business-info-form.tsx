"use client"

import { useActionState } from "react"
import { saveBusinessInfo } from "@/app/a/(dashboard)/settings/actions"
import type { BusinessInfo } from "@/lib/site/business-info"
import type { ActionResult } from "@/lib/errors"

const FIELD =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"

/**
 * Order follows how the footer reads it, so the form and the result line up.
 * `hint` only where the value is a number nobody remembers the shape of.
 */
const FIELDS: {
  name: keyof BusinessInfo
  column: string
  label: string
  hint?: string
}[] = [
  { name: "businessName", column: "business_name", label: "상호" },
  { name: "representativeName", column: "representative_name", label: "대표자" },
  {
    name: "businessNumber",
    column: "business_number",
    label: "사업자등록번호",
    hint: "000-00-00000",
  },
  {
    name: "mailOrderNumber",
    column: "mail_order_number",
    label: "통신판매업 신고번호",
    hint: "제0000-지역0000호",
  },
  { name: "address", column: "address", label: "주소" },
  { name: "phone", column: "phone", label: "전화번호" },
  { name: "email", column: "email", label: "이메일" },
  {
    name: "privacyOfficer",
    column: "privacy_officer",
    label: "개인정보관리책임자",
  },
]

export function BusinessInfoForm({ info }: { info: BusinessInfo }) {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(saveBusinessInfo, null)

  return (
    <form action={formAction} className="max-w-md space-y-5">
      {FIELDS.map((f) => (
        <div key={f.column}>
          <label htmlFor={f.column} className="text-sm text-foreground">
            {f.label}
          </label>
          <input
            id={f.column}
            name={f.column}
            type="text"
            defaultValue={info[f.name]}
            className={FIELD}
          />
          {f.hint ? (
            <p className="mt-1.5 text-xs text-muted-foreground">{f.hint}</p>
          ) : null}
        </div>
      ))}

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          저장했습니다. 사이트 하단에 바로 반영됩니다.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "저장하는 중…" : "저장"}
      </button>
    </form>
  )
}
