import type { SupabaseClient } from "@supabase/supabase-js"
import { createServiceClient } from "@/lib/supabase/service"
import {
  SESSION_SUMMARY_SELECT,
  mapSessionSummary,
  type SessionSummaryRelation,
} from "@/lib/bookings/session-summary"
import { money, type Money } from "@/lib/payments/money"
import type { BookingStatus } from "@/lib/bookings/types"

/**
 * Admin views over member accounts.
 *
 * There is no `members` table — migration 027 dropped it and moved the common
 * profile (name/phone/locale) into `auth.users.app_metadata`, with bookings
 * referencing auth.users directly. So the member roster is an auth-side query,
 * reachable only with the service key, and bookings/payments come from the
 * admin's own client via the "admin all" policies.
 */

export type AdminMemberListItem = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  createdAt: string
  lastSignInAt: string | null
  bookingCount: number
  banned: boolean
}

export type AdminMemberBooking = {
  id: string
  status: BookingStatus
  createdAt: string
  sessionTitle: string
  sessionStartsAt: string
  sessionEndsAt: string
  floorName: string
  instructorName: string
  price: Money
  payment: {
    status: string
    amount: Money
    provider: string
    merchantUid: string
    paidAt: string | null
  } | null
}

export type AdminMemberDetail = {
  profile: AdminMemberListItem
  bookings: AdminMemberBooking[]
}

/** auth.users fields the published User type omits. */
type RawUser = {
  id: string
  email?: string | null
  created_at: string
  last_sign_in_at?: string | null
  banned_until?: string | null
  app_metadata?: Record<string, unknown> | null
  user_metadata?: Record<string, unknown> | null
}

/** Supabase bans by writing a far-future timestamp; past values are expired. */
function isBanned(bannedUntil: string | null | undefined): boolean {
  if (!bannedUntil) return false
  const until = Date.parse(bannedUntil)
  return Number.isFinite(until) && until > Date.now()
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

/**
 * A member is an auth user with role=member. Accounts mid-signup have no role
 * yet but do carry signup_intent, and they can already hold bookings, so they
 * count too — otherwise they would be invisible to admins.
 */
export function isMemberUser(user: RawUser): boolean {
  const role = user.app_metadata?.role
  if (role === "member") return true
  if (role) return false // admin / partner
  return user.user_metadata?.signup_intent === "member"
}

function toListItem(user: RawUser, bookingCount: number): AdminMemberListItem {
  const meta = user.app_metadata ?? {}
  return {
    id: user.id,
    name: str(meta.name),
    phone: str(meta.phone),
    email: user.email ?? null,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at ?? null,
    bookingCount,
    banned: isBanned(user.banned_until),
  }
}

/** Every auth user, walking the admin API's pages. */
async function listAllAuthUsers(): Promise<RawUser[]> {
  const service = createServiceClient()
  const perPage = 1000
  const out: RawUser[] = []

  for (let page = 1; ; page += 1) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage })
    if (error) throw new Error(error.message)
    const users = (data?.users ?? []) as unknown as RawUser[]
    out.push(...users)
    if (users.length < perPage) break
  }

  return out
}

export async function getAdminMembers(
  supabase: SupabaseClient,
  search?: string,
): Promise<AdminMemberListItem[]> {
  const members = (await listAllAuthUsers()).filter(isMemberUser)
  if (members.length === 0) return []

  const counts = await bookingCountsByUser(
    supabase,
    members.map((user) => user.id),
  )

  const items = members
    .map((user) => toListItem(user, counts.get(user.id) ?? 0))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const q = search?.trim().toLowerCase()
  if (!q) return items
  return items.filter((item) =>
    [item.name, item.phone, item.email].some((field) =>
      field?.toLowerCase().includes(q),
    ),
  )
}

/** Active (non-cancelled) bookings per user. */
async function bookingCountsByUser(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  if (ids.length === 0) return out

  const { data, error } = await supabase
    .from("bookings")
    .select("user_id")
    .in("user_id", ids)
    .neq("status", "cancelled")

  if (error) throw new Error(error.message)
  for (const row of (data ?? []) as { user_id: string | null }[]) {
    if (!row.user_id) continue
    out.set(row.user_id, (out.get(row.user_id) ?? 0) + 1)
  }
  return out
}

type PaymentRow = {
  status: string
  amount: number | string
  currency: string
  pg_provider: string
  merchant_uid: string
  paid_at: string | null
}

type BookingRow = {
  id: string
  status: BookingStatus
  created_at: string
  session: SessionSummaryRelation
  payments: PaymentRow[] | PaymentRow | null
}

export async function getAdminMemberDetail(
  supabase: SupabaseClient,
  memberId: string,
): Promise<AdminMemberDetail | null> {
  const service = createServiceClient()
  const { data, error } = await service.auth.admin.getUserById(memberId)
  if (error) return null

  const user = data?.user as unknown as RawUser | undefined
  if (!user || !isMemberUser(user)) return null

  const [counts, bookings] = await Promise.all([
    bookingCountsByUser(supabase, [user.id]),
    getMemberBookingHistory(supabase, user.id),
  ])

  return {
    profile: toListItem(user, counts.get(user.id) ?? 0),
    bookings,
  }
}

/**
 * Full history, cancellations included — unlike the member-facing list, which
 * hides them. Admins open this to answer "what happened", so a cancelled
 * booking is exactly the row they need.
 */
async function getMemberBookingHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<AdminMemberBooking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      created_at,
      session:sessions (${SESSION_SUMMARY_SELECT}),
      payments (
        status,
        amount,
        currency,
        pg_provider,
        merchant_uid,
        paid_at
      )
    `,
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as BookingRow[]

  return rows.flatMap((booking) => {
    const summary = mapSessionSummary(booking.session)
    // A booking whose session row is gone has nothing to show; drop it rather
    // than render placeholders, matching the member-facing query.
    if (!summary) return []

    const payment = Array.isArray(booking.payments)
      ? booking.payments[0]
      : booking.payments

    return [
      {
        id: booking.id,
        status: booking.status,
        createdAt: booking.created_at,
        sessionTitle: summary.title,
        sessionStartsAt: summary.startsAt,
        sessionEndsAt: summary.endsAt,
        floorName: summary.floorName,
        instructorName: summary.instructorName,
        price: summary.price,
        payment: payment
          ? {
              status: payment.status,
              amount: money(payment.currency, payment.amount),
              provider: payment.pg_provider,
              merchantUid: payment.merchant_uid,
              paidAt: payment.paid_at,
            }
          : null,
      },
    ]
  })
}
