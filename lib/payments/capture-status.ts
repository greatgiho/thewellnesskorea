/**
 * What a PayPal capture's reported state means for the booking behind it.
 *
 * Pure on purpose: the reconcile job that uses this is server-only, and the
 * decision it encodes — when to take a seat away from someone who may have
 * paid — is the part worth testing on its own.
 */

export type CaptureOutcome = "confirm" | "release" | "wait"

/**
 * Anything unrecognised waits. Guessing on a status we do not model could
 * confirm an unpaid booking or cancel a paid one, and a seat held a day longer
 * is the cheaper mistake.
 */
export function captureOutcome(status: string | undefined): CaptureOutcome {
  switch (status) {
    case "COMPLETED":
      return "confirm"
    // DECLINED/FAILED never became money. REFUNDED means it did and went back;
    // either way the booking was never confirmed, so let the seat go.
    case "DECLINED":
    case "FAILED":
    case "REFUNDED":
      return "release"
    default:
      return "wait"
  }
}
