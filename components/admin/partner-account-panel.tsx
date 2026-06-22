"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { reissueTeacherPassword } from "@/app/admin/actions"
import type { PartnerWithPrograms } from "@/lib/partners/types"

type PartnerAccountPanelProps = {
  person: PartnerWithPrograms
}

export function PartnerAccountPanel({ person }: PartnerAccountPanelProps) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const hasEmail = Boolean(person.email?.trim())
  const hasAccount = Boolean(person.user_id)

  if (!hasEmail) {
    return (
      <div className="rounded-2xl border border-border bg-card/40 p-5">
        <h2 className="font-serif text-lg text-foreground">Teacher account</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Save an email address to provision a teacher login.
        </p>
      </div>
    )
  }

  const onReissue = async () => {
    setMessage(null)
    setError(null)
    setPending(true)
    try {
      await reissueTeacherPassword(person.id)
      setMessage("A new temporary password was emailed to the teacher.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reissue password.")
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-5">
      <h2 className="font-serif text-lg text-foreground">Teacher account</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Login: <span className="text-foreground">{person.email}</span>
        {hasAccount ? (
          <span className="ml-2 text-xs text-primary">· Account linked</span>
        ) : (
          <span className="ml-2 text-xs text-amber-700 dark:text-amber-300">
            · Account pending (save with email or approve)
          </span>
        )}
      </p>

      {message && (
        <p className="mt-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          {message}
        </p>
      )}
      {error && (
        <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {hasAccount && (
        <button
          type="button"
          disabled={pending}
          onClick={onReissue}
          className="mt-4 inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm hover:bg-muted disabled:opacity-50"
        >
          {pending ? "Sending…" : "Reissue temporary password"}
        </button>
      )}
    </div>
  )
}
