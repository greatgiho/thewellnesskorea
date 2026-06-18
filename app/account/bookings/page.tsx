import type { Metadata } from "next"
import { MemberBookingsList } from "@/components/account/member-bookings-list"
import { getMemberBookingsForUser, getMemberProfileForUser } from "@/lib/bookings/member-queries"
import { requireMemberSession } from "@/lib/auth/require-session"

export const metadata: Metadata = {
  title: "My reservations — The Wellness Korea",
  description: "View and manage your class reservations at Brickwell.",
}

export default async function AccountBookingsPage() {
  const { userId } = await requireMemberSession()
  const [bookings, profile] = await Promise.all([
    getMemberBookingsForUser(userId),
    getMemberProfileForUser(userId),
  ])

  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
        Account
      </p>
      <h1 className="mt-4 font-serif text-4xl font-light text-foreground">
        My reservations
      </h1>
      {profile?.name ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Signed in as {profile.name}
        </p>
      ) : null}

      <div className="mt-10">
        <MemberBookingsList bookings={bookings} />
      </div>
    </div>
  )
}
