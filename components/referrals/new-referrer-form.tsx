"use client"

import { useActionState, useEffect, useRef } from "react"
import { createReferrer } from "@/lib/referrals/actions"
import type { ActionResult } from "@/lib/errors"

const FIELD =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary"

export function NewReferrerForm() {
  const [state, formAction, pending] = useActionState<
    ActionResult | null,
    FormData
  >(createReferrer, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.ok) formRef.current?.reset()
  }, [state])

  return (
    <form ref={formRef} action={formAction} className="max-w-md space-y-5">
      <div>
        <label htmlFor="code" className="text-sm text-foreground">
          코드
        </label>
        <input id="code" name="code" required className={FIELD} placeholder="cafe-tongui" />
        <p className="mt-1.5 text-xs text-muted-foreground">
          영문·숫자·하이픈·밑줄 2~32자. 대소문자 구분 안 함.
        </p>
      </div>

      <div>
        <label htmlFor="name" className="text-sm text-foreground">
          이름
        </label>
        <input id="name" name="name" required className={FIELD} placeholder="통의동 카페" />
      </div>

      <div>
        <label htmlFor="note" className="text-sm text-foreground">
          메모
        </label>
        <input id="note" name="note" className={FIELD} placeholder="요율·담당자 등" />
      </div>

      {state && !state.ok ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-foreground">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "만드는 중…" : "만들기"}
      </button>
    </form>
  )
}
