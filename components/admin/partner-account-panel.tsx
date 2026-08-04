"use client"

import { useState } from "react"
import { provisionPartnerAccount } from "@/app/a/actions"
import type { PartnerWithPrograms } from "@/lib/partners/types"

type Props = { person: PartnerWithPrograms }

export function PartnerAccountPanel({ person }: Props) {
  const [status, setStatus] = useState<"idle" | "pending" | "ok" | "error">("idle")
  const [message, setMessage] = useState<string | null>(null)

  const hasAccount = !!person.user_id
  const hasEmail = !!person.email?.trim()

  const handleProvision = async () => {
    if (!confirm(hasAccount ? "초대 링크를 다시 보내시겠습니까?" : "파트너 포털 계정을 만들고 초대 링크를 보내시겠습니까?")) return
    setStatus("pending")
    setMessage(null)
    const result = await provisionPartnerAccount(person.id)
    if (result.ok) {
      setStatus("ok")
      setMessage(
        result.isNew
          ? "Created the account and emailed the invite link."
          : "Emailed the invite link again.",
      )
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
              ? "초대 링크 재전송"
              : "계정 생성 · 초대"}
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
