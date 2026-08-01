/** User-visible validation or policy errors (safe to show in UI). */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UserFacingError"
  }
}

export function isUserFacingError(error: unknown): error is UserFacingError {
  return error instanceof UserFacingError
}

/**
 * What a mutating server action returns instead of throwing.
 *
 * Next does not send a thrown error's message to the client in production —
 * it replaces it with a digest — so an action that throws shows the user a
 * generic failure however carefully the message was worded. Returning the
 * outcome keeps the wording intact.
 *
 * Actions that only redirect, and read-only actions, have no need for this.
 */
export type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Run a mutation and report it as an ActionResult.
 *
 * A UserFacingError is meant for the person on the other end, so its message
 * is passed through. Anything else is an internal failure: it gets logged
 * with `label` and the user sees `fallback`, so a stack trace or a database
 * message never lands in the UI.
 */
export async function asActionResult(
  label: string,
  fallback: string,
  run: () => Promise<void>,
): Promise<ActionResult> {
  try {
    await run()
    return { ok: true }
  } catch (error) {
    if (isUserFacingError(error)) return { ok: false, error: error.message }
    console.error(`[${label}]`, error)
    return { ok: false, error: fallback }
  }
}
