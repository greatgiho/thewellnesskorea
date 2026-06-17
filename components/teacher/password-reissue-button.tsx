"use client"

import { useState } from "react"
import { requestTeacherPasswordReissue } from "@/app/teacher/actions"
import { Button } from "@/components/ui/button"

export function PasswordReissueButton() {
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onClick = async () => {
    setMessage(null)
    setError(null)
    setPending(true)
    try {
      await requestTeacherPasswordReissue()
      setMessage("등록된 이메일로 새 임시 비밀번호를 발송했습니다.")
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "비밀번호 재발급에 실패했습니다.",
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        비밀번호를 잊으셨다면 등록된 이메일로 새 임시 비밀번호를 받을 수 있습니다.
      </p>
      {message && (
        <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="button" variant="outline" disabled={pending} onClick={onClick}>
        {pending ? "발송 중…" : "임시 비밀번호 이메일로 받기"}
      </Button>
    </div>
  )
}
