import "server-only"

import QRCode from "qrcode"
import { createServiceClient } from "@/lib/supabase/service"
import { siteOrigin } from "@/lib/site-origin"
import { REFERRAL_PARAM } from "@/lib/referrals/cookie"

export type Referrer = {
  id: string
  code: string
  name: string
  note: string
  isActive: boolean
  createdAt: string
}

export type ReferrerStats = {
  /** Every booking stamped with this code, whatever became of it. */
  total: number
  /** Confirmed and still standing. */
  confirmed: number
  /** Cancelled after the fact, or a hold that lapsed unpaid. */
  lost: number
  /** Money actually taken and not refunded, by currency. */
  revenue: { currency: string; amount: number }[]
}

/**
 * The link a partner hands out.
 *
 * siteOrigin rather than deploymentOrigin: this one gets printed on a card and
 * stuck to a wall. A preview URL would work for a week and then stop, long
 * after anyone remembers where the QR came from.
 */
export function referralLink(code: string, path = "/"): string {
  const url = new URL(path, siteOrigin())
  url.searchParams.set(REFERRAL_PARAM, code)
  return url.toString()
}

/**
 * The link as a scannable SVG, rendered on the server.
 *
 * Same approach as the ticket QR — no QR library reaches the browser, and SVG
 * stays sharp whether it ends up on a screen or on a printed card, which is
 * the whole point of this one.
 */
export async function referralQrSvg(link: string): Promise<string> {
  return QRCode.toString(link, {
    type: "svg",
    margin: 1,
    // Higher than the ticket's M: this can end up printed, folded, and read
    // in a café, where the ticket QR only ever has to survive a phone screen.
    errorCorrectionLevel: "Q",
  })
}

export async function listReferrers(): Promise<Referrer[]> {
  const service = createServiceClient()
  const { data, error } = await service
    .from("referrers")
    .select("id, code, name, note, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[referral] list failed:", error.message)
    return []
  }

  return (data ?? []).map((r) => ({
    id: r.id as string,
    code: r.code as string,
    name: r.name as string,
    note: (r.note as string) ?? "",
    isActive: Boolean(r.is_active),
    createdAt: r.created_at as string,
  }))
}

type StatRow = {
  referral_code: string | null
  status: string
  payments: { status: string; amount: number | string; currency: string }[] | null
}

/**
 * Counts and takings per code, in one pass.
 *
 * One query for every referrer rather than one each: the numbers are small and
 * a partner statement is read as a whole, so the cost of reading a few hundred
 * bookings once is lower than the round trips.
 *
 * Revenue counts paid payments only. A refund marks the payment cancelled (see
 * releaseDeniedBooking), so a booking that was paid for and then refunded
 * contributes nothing here — which is the only version of this number anyone
 * would agree to pay against.
 */
export async function referrerStats(): Promise<Map<string, ReferrerStats>> {
  const service = createServiceClient()
  const { data, error } = await service
    .from("bookings")
    .select("referral_code, status, payments (status, amount, currency)")
    .not("referral_code", "is", null)

  const stats = new Map<string, ReferrerStats>()
  if (error) {
    console.error("[referral] stats failed:", error.message)
    return stats
  }

  for (const row of (data ?? []) as unknown as StatRow[]) {
    const key = (row.referral_code ?? "").toLowerCase()
    if (!key) continue

    const entry = stats.get(key) ?? {
      total: 0,
      confirmed: 0,
      lost: 0,
      revenue: [],
    }
    entry.total += 1
    if (row.status === "confirmed") entry.confirmed += 1
    else if (row.status === "cancelled") entry.lost += 1

    for (const p of row.payments ?? []) {
      if (p.status !== "paid") continue
      const currency = p.currency || "KRW"
      const line = entry.revenue.find((r) => r.currency === currency)
      const amount = Number(p.amount ?? 0)
      if (line) line.amount += amount
      else entry.revenue.push({ currency, amount })
    }

    stats.set(key, entry)
  }

  return stats
}
