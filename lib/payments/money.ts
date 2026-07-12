import type { Currency } from "@/lib/schedule/types"

/**
 * A price/charge as a single value: currency + amount. Bundling the pair keeps
 * formatting, the PayPal amount string, and numeric-as-string coercion in one
 * place instead of scattered across queries and components.
 */
export type Money = { currency: Currency; amount: number }

/** Build a Money from raw DB/form values (coerces PostgREST numeric strings). */
export function money(
  currency: string | null | undefined,
  amount: number | string | null | undefined,
): Money {
  return {
    currency: (currency as Currency) || "USD",
    amount: Number(amount ?? 0),
  }
}

/** Above 0 = requires online payment; 0 = free / on-site. */
export function isPaid(m: Money): boolean {
  return m.amount > 0
}

/** PayPal decimal amount string, e.g. "30.00". */
export function toPaypalAmount(m: Money): string {
  return m.amount.toFixed(2)
}

/** Localized display: KRW no decimals (ko-KR), otherwise 2 decimals (en-US). */
export function formatMoney(m: Money): string {
  const isKrw = m.currency === "KRW"
  return new Intl.NumberFormat(isKrw ? "ko-KR" : "en-US", {
    style: "currency",
    currency: m.currency,
    ...(isKrw ? { maximumFractionDigits: 0 } : {}),
  }).format(m.amount)
}
