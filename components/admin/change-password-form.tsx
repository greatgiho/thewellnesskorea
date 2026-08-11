"use client"

import { useActionState, useEffect, useRef } from "react"
import { changeAdminPassword } from "@/app/a/(dashboard)/settings/actions"
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/password"
import type { ActionResult } from "@/lib/errors"

const FIELD =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"

export function ChangePasswordForm({ email }: { email: string }) {
  const [state, formAction, pending] = useActionState<ActionResult | null, FormData>(
    changeAdminPassword,
    null,
  )
  const formRef = useRef<HTMLFormElement>(null)

  // Clear the fields once it worked, so a shared screen is not left showing
  // the new password in a form the browser will happily re-submit.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-5">
      {/* Here for password managers, which need to see which account is being
          changed to offer to update the saved entry. */}
      <input type="hidden" name="username" autoComplete="username" value={email} readOnly />

      <div>
        <label htmlFor="currentPassword" className="text-sm text-foreground">
          현재 비밀번호
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="text-sm text-foreground">
          새 비밀번호
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={FIELD}
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {MIN_PASSWORD_LENGTH}자 이상.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-sm text-foreground">
          새 비밀번호 확인
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          className={FIELD}
        />
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-foreground">
          비밀번호를 바꿨습니다. 다음 로그인부터 새 비밀번호를 쓰세요.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "바꾸는 중…" : "비밀번호 변경"}
      </button>
    </form>
  )
}
