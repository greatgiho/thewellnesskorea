"use client"

import { useState } from "react"
import { provisionPartnerAccount } from "@/app/admin/actions"
import type { PartnerWithPrograms } from "@/lib/partners/types"

type Props = { person: PartnerWithPrograms }

export function PartnerAccountPanel({ person }: Props) {
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  const hasAccount = !!person.user_id
  const hasEmail = !!person.email?.trim()

  const handleProvision = async () => {
    if (!confirm(hasAccount ? "임시 비밀번호를 재발급하고 이메일로 전송하시겠습니까?" : "파트너 포털 계정을 생성하시겠습니까?")) return
    setStatus("pending")
    setMessage(null)
    const result = await provisionPartnerAccount(person.id)
    if (result.ok) {
      setStatus("ok")
      setMessage(result.isNew ? "계정이 생성되고 이메일로 발송되었습니다." : "임시 비밀번호가 이메일로 발송되었습니다.")
    } else {
      setStatus("error")
      setMessage(result.error)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <h3 className="text-sm font-medium text-foreground">파트너 포털 계정</h3>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <div>
          <p className="text-xs text-muted-foreground">계정 상태</p>
          <p className="mt-0.5 text-sm font-medium">
            {hasAccount ? (
              <span className="text-primary">계정 연결됨</span>
            ) : (
              <span className="text-muted-foreground">계정 없음</span>
            )}
          </p>
        </div>
        {hasEmail ? (
          <button
            type="button"
            onClick={handleProvision}
            disabled={status === "pending"}
            className="ml-auto inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-foreground hover:bg-muted disabled:opacity-50"
          >
            {status === "pending"
              ? "처리 중…"
              : hasAccount
              ? "비밀번호 재발급"
              : "계정 생성"}
          </button>
        ) : (
          <p className="ml-auto text-xs text-muted-foreground">
            이메일을 먼저 입력해 주세요.
          </p>
        )}
      </div>
      {message && (
        <p className={`mt-3 text-sm ${status === "error" ? "text-destructive" : "text-primary"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
