"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { approvePerson, rejectPerson } from "@/app/admin/actions"
import {
  isSelfRegistered,
  registrationStatusLabel,
} from "@/lib/people/registration-status"
import type { PersonWithPrograms } from "@/lib/people/types"

type PersonReviewPanelProps = {
  person: PersonWithPrograms
}

export function PersonReviewPanel({ person }: PersonReviewPanelProps) {
  const router = useRouter()
  const [reason, setReason] = useState(person.rejection_reason ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!isSelfRegistered(person.registration_status)) return null

  const onApprove = async () => {
    setError(null)
    setPending(true)
    try {
      await approvePerson(person.id)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve.")
    } finally {
      setPending(false)
    }
  }

  const onReject = async () => {
    setError(null)
    setPending(true)
    try {
      await rejectPerson(person.id, reason)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-amber-400/40 bg-amber-50/50 p-5 dark:bg-amber-950/20">
      <h2 className="font-serif text-lg text-foreground">셀프 등록 검토</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        상태:{" "}
        <span className="font-medium text-foreground">
          {registrationStatusLabel(person.registration_status, "ko")}
        </span>
        {person.submitted_at && (
          <>
            {" "}
            · 제출{" "}
            {new Date(person.submitted_at).toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            })}
          </>
        )}
      </p>

      {error && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || person.registration_status === "approved"}
          onClick={onApprove}
          className="inline-flex h-9 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-600/90 disabled:opacity-50"
        >
          승인
        </button>
      </div>

      <label className="mt-4 block space-y-1.5">
        <span className="text-sm font-medium">반려 사유</span>
        <textarea
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="반려 시 선생님에게 표시됩니다."
        />
      </label>
      <button
        type="button"
        disabled={pending}
        onClick={onReject}
        className="mt-3 inline-flex h-9 items-center rounded-lg border border-destructive/40 px-4 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
      >
        반려
      </button>
    </div>
  )
}
