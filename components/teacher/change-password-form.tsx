"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { changeTeacherPassword } from "@/app/teacher/actions"
import { Button } from "@/components/ui/button"

type ChangePasswordFormProps = {
  forced?: boolean
}

export function ChangePasswordForm({ forced = false }: ChangePasswordFormProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 8) {
      setError("새 비밀번호는 8자 이상이어야 합니다.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("새 비밀번호가 일치하지 않습니다.")
      return
    }

    setPending(true)
    try {
      await changeTeacherPassword(currentPassword, newPassword)
      router.push("/teacher")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다.")
    } finally {
      setPending(false)
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-md space-y-5">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {forced && (
        <p className="text-sm text-muted-foreground">
          보안을 위해 임시 비밀번호를 새 비밀번호로 변경해 주세요.
        </p>
      )}
      <label className="block space-y-2">
        <span className="text-sm font-medium">
          {forced ? "임시 비밀번호" : "현재 비밀번호"}
        </span>
        <input
          type="password"
          required
          autoComplete="current-password"
          className={fieldClass}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">새 비밀번호</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">새 비밀번호 확인</span>
        <input
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          className={fieldClass}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
      </label>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "저장 중…" : "비밀번호 변경"}
      </Button>
    </form>
  )
}
