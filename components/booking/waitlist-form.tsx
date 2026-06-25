"use client"

import { useActionState } from "react"
import { joinWaitlist, type WaitlistState } from "@/app/book/waitlist-actions"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { BookingSessionSummary } from "./booking-session-summary"

const fieldClass =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/20"

const initialState: WaitlistState = {}

type MemberPrefill = {
  name: string
  email: string
  phone?: string | null
}

type WaitlistFormProps = {
  session: SessionWithRelations
  memberPrefill?: MemberPrefill | null
}

export function WaitlistForm({ session, memberPrefill }: WaitlistFormProps) {
  const [state, formAction, pending] = useActionState(joinWaitlist, initialState)

  if (state.ok) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
          You&apos;re on the waitlist
        </p>
        <p className="mt-3 text-base text-foreground">
          We&apos;ll email you if a spot opens up. No action needed until then.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <BookingSessionSummary session={session} />

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="sessionId" value={session.id} />

        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Join the waitlist
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This class is currently full. Leave your details and we&apos;ll email
            you immediately if a spot opens up.
          </p>

          <div className="mt-6 space-y-4">
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Full name</span>
              <input
                name="guestName"
                type="text"
                required
                autoComplete="name"
                className={fieldClass}
                placeholder="Your name"
                defaultValue={memberPrefill?.name ?? ""}
                readOnly={Boolean(memberPrefill)}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input
                name="guestEmail"
                type="email"
                required
                autoComplete="email"
                className={fieldClass}
                placeholder="you@example.com"
                defaultValue={memberPrefill?.email ?? ""}
                readOnly={Boolean(memberPrefill)}
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-sm font-medium">
                Phone{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </span>
              <input
                name="guestPhone"
                type="tel"
                autoComplete="tel"
                className={fieldClass}
                placeholder="+82 10 0000 0000"
                defaultValue={memberPrefill?.phone ?? ""}
              />
            </label>
          </div>

          {state.error ? (
            <p className="mt-4 text-sm text-destructive">{state.error}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
          >
            {pending ? "Joining…" : "Join waitlist"}
          </button>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            You&apos;ll receive one email when a spot opens. No spam, no account
            required.
          </p>
        </div>
      </form>
    </div>
  )
}
