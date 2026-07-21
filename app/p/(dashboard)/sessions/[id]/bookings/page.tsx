import { notFound } from "next/navigation"
import Link from "next/link"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { getSessionBookings } from "@/lib/partner/queries"
import { formatSessionTime } from "@/lib/partner/utils"
import { createClient } from "@/lib/supabase/server"

type Props = { params: Promise<{ id: string }> }

export default async function SessionBookingsPage({ params }: Props) {
  const { id } = await params
  const { supabase, partner } = await requirePartnerSession()

  type SessionWithFloor = {
    id: string; title: string; starts_at: string; ends_at: string
    capacity: number; booked_count: number; status: string
    floor: { name_ko: string; level: number } | null
  }

  // 세션이 본인 것인지 확인
  const { data: session } = await supabase
    .from("sessions")
    .select("id, title, starts_at, ends_at, capacity, booked_count, status, floor:floors(name_ko, level)")
    .eq("id", id)
    .eq("instructor_id", partner.id)
    .maybeSingle() as { data: SessionWithFloor | null, error: unknown }

  if (!session) notFound()

  const bookings = await getSessionBookings(supabase, id)

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/p"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← 예정 클래스
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-light text-foreground">
          {session.title}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatSessionTime(session.starts_at, session.ends_at)}
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-border bg-card/40 px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">예약</p>
          <p className="mt-1 text-2xl font-light">{session.booked_count} <span className="text-sm text-muted-foreground">/ {session.capacity}명</span></p>
        </div>
        {session.floor && (
          <div className="ml-auto">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">장소</p>
            <p className="mt-1 text-sm">{session.floor.level}F · {session.floor.name_ko}</p>
          </div>
        )}
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          아직 예약자가 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">이메일</th>
                <th className="px-4 py-3 font-medium">전화번호</th>
                <th className="px-4 py-3 font-medium">예약일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bookings.map((booking, i) => (
                <tr key={booking.id} className="bg-card">
                  <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{booking.guest_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{booking.guest_email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{booking.guest_phone ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(booking.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
