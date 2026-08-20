/**
 * The cancellation scale, in one place.
 *
 * It is written down here rather than typed into the page because it is shown
 * twice: in full on /refunds, and as the one-line summary the 전자상거래법
 * requires next to a payment button. Two copies of a refund schedule is how a
 * customer ends up quoting the wrong one back at you.
 *
 * The figures follow the 공정거래위원회 소비자분쟁해결기준 for 공연업, which is
 * what the policy document commits to.
 */

export type RefundStep = {
  /** When the cancellation is made, relative to the day of the class. */
  when: string
  /** Percentage kept by us. */
  deducted: string
  /** What comes back. */
  refunded: string
  /** The compressed form, for the line beside the pay button. */
  short: string
}

export const REFUND_STEPS: RefundStep[] = [
  { when: "이용일 10일 전까지", deducted: "0%", refunded: "결제금액 100%", short: "10일 전 100%" },
  { when: "이용일 9일 전 ~ 7일 전", deducted: "10%", refunded: "결제금액 90%", short: "7일 전 90%" },
  { when: "이용일 6일 전 ~ 3일 전", deducted: "20%", refunded: "결제금액 80%", short: "3일 전 80%" },
  { when: "이용일 2일 전 ~ 1일 전", deducted: "30%", refunded: "결제금액 70%", short: "1일 전 70%" },
  { when: "이용일 당일, 프로그램 시작 전", deducted: "90%", refunded: "결제금액 10%", short: "당일 10%" },
  { when: "프로그램 시작 이후 · 미방문(No-show)", deducted: "100%", refunded: "환불 불가", short: "시작 후·미방문 불가" },
]

/**
 * The summary that has to sit near the pay button.
 *
 * 전자상거래법 requires the withdrawal period and the refund basis to be shown
 * where somebody is about to commit, not only on a page they could go and find.
 * Built from REFUND_STEPS so it cannot drift from the table it summarises.
 */
export function refundSummary(): string {
  return `취소 시 환불: ${REFUND_STEPS.map((s) => s.short).join(" / ")}`
}

/** 전자상거래법 제17조 — seven days, and when it stops applying. */
export const WITHDRAWAL_NOTICE =
  "결제일부터 7일 이내에는 위약금 없이 청약철회가 가능합니다. 다만 그 기간 안에 프로그램 제공이 시작된 경우에는 시작된 부분에 대해 철회가 제한됩니다."

/** When these documents take effect. */
export const LEGAL_EFFECTIVE_DATE = "2026년 8월 21일"
export const LEGAL_UPDATED_EN = "August 21, 2026"
