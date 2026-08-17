import "server-only"

import QRCode from "qrcode"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import { formatSessionWhen } from "@/lib/referrals/links"

/**
 * Which client reads.
 *
 * The admin screens pass nothing and get the service client, as before. /v
 * passes its own request-scoped client so a read-only collaborator is read
 * through RLS rather than around it — there are viewer SELECT policies for
 * exactly these two tables (062), and a service client would make them
 * decorative.
 */
type Db = SupabaseClient

export type Referrer = {
  id: string
  code: string
  name: string
  note: string
  isActive: boolean
  createdAt: string
}

/** The class a link points at, as far as we can still see it. */
export type LinkedSession = {
  id: string
  title: string
  startsAt: string
  /** False once the class has been called off; the printed QR has not been. */
  isCancelled: boolean
}

export type ReferralLink = {
  id: string
  referrerId: string
  path: string
  label: string
  session: LinkedSession | null
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
  /**
   * Which classes the bookings were for, biggest first.
   *
   * Grouped by the class that was booked, not by the link that was scanned.
   * Someone can scan the QR for Saturday's class and book Sunday's, and the
   * money is Sunday's — so this is the column a statement gets written from.
   */
  bySession: { sessionId: string; title: string; when: string; count: number }[]
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

export async function listReferrers(db?: Db): Promise<Referrer[]> {
  const service = db ?? createServiceClient()
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

type LinkRow = {
  id: string
  referrer_id: string
  path: string
  label: string | null
  created_at: string
  session:
    | { id: string; title: string; starts_at: string; status: string }
    | { id: string; title: string; starts_at: string; status: string }[]
    | null
}

/**
 * Every saved link, for every partner.
 *
 * One query rather than one per referrer: the whole point of the screen is to
 * see them side by side, and there are tens of these, not thousands. The caller
 * groups by referrerId.
 */
export async function listReferralLinks(db?: Db): Promise<ReferralLink[]> {
  const service = db ?? createServiceClient()
  const { data, error } = await service
    .from("referral_links")
    .select(
      "id, referrer_id, path, label, created_at, session:sessions (id, title, starts_at, status)",
    )
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[referral] link list failed:", error.message)
    return []
  }

  return ((data ?? []) as unknown as LinkRow[]).map((row) => {
    const session = Array.isArray(row.session) ? row.session[0] : row.session
    return {
      id: row.id,
      referrerId: row.referrer_id,
      path: row.path,
      label: row.label ?? "",
      createdAt: row.created_at,
      session: session
        ? {
            id: session.id,
            title: session.title,
            startsAt: session.starts_at,
            isCancelled: session.status === "cancelled",
          }
        : null,
    }
  })
}

/**
 * The classes an admin can point a new link at.
 *
 * Unlisted classes included on purpose: a class that is bookable but kept off
 * the schedule (060) is precisely the kind you hand out as a link, and leaving
 * those out would make the two features useless together.
 *
 * Past classes are left out — a QR for something that already happened is not
 * a thing anyone means to make.
 */
export async function listLinkableSessions(): Promise<LinkedSession[]> {
  const service = createServiceClient()
  const { data, error } = await service
    .from("sessions")
    .select("id, title, starts_at, status")
    .gte("starts_at", new Date().toISOString())
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true })
    .limit(200)

  if (error) {
    console.error("[referral] session list failed:", error.message)
    return []
  }

  return (data ?? []).map((s) => ({
    id: s.id as string,
    title: s.title as string,
    startsAt: s.starts_at as string,
    isCancelled: false,
  }))
}

type StatRow = {
  referral_code: string | null
  session_id: string | null
  status: string
  payments: { status: string; amount: number | string; currency: string }[] | null
  session: { title: string; starts_at: string } | { title: string; starts_at: string }[] | null
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
    .select(
      "referral_code, session_id, status, payments (status, amount, currency), session:sessions (title, starts_at)",
    )
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
      bySession: [],
    }
    entry.total += 1
    if (row.status === "confirmed") entry.confirmed += 1
    else if (row.status === "cancelled") entry.lost += 1

    const session = Array.isArray(row.session) ? row.session[0] : row.session
    if (row.session_id && session) {
      const line = entry.bySession.find((s) => s.sessionId === row.session_id)
      if (line) line.count += 1
      else {
        entry.bySession.push({
          sessionId: row.session_id,
          title: session.title,
          when: formatSessionWhen(session.starts_at),
          count: 1,
        })
      }
    }

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

  // Biggest first: the screen shows a few lines per partner, and the class
  // worth arguing about is the one that sold.
  for (const entry of stats.values()) {
    entry.bySession.sort((a, b) => b.count - a.count)
  }

  return stats
}
