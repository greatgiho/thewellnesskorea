import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { BookingPageLayout } from "@/components/booking/booking-page-layout"
import { GuestBookingForm } from "@/components/booking/guest-booking-form"
import { WaitlistForm } from "@/components/booking/waitlist-form"
import { getOptionalMemberSession } from "@/lib/auth/require-session"
import { isMemberAuthUser } from "@/lib/auth/member-email"
import { getBookableSession } from "@/lib/bookings/queries"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { getSessionPhotoUrl } from "@/lib/schedule/images"
import { socialMetadata } from "@/lib/seo/metadata"
import { getMemberProfileForUser } from "@/lib/bookings/member-queries"
import { mapSessionToClassItem } from "@/lib/schedule/map-public-class"
import { COUPON_PARAM, couponFromParam } from "@/lib/coupons/link"

type BookSessionPageProps = {
  params: Promise<{ sessionId: string }>
  /**
   * `?coupon=CODE` prefills the coupon box (#268). Reading it here makes the
   * page dynamic in principle; it already was, because the member lookup below
   * reads cookies.
   */
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
  params,
}: BookSessionPageProps): Promise<Metadata> {
  const { sessionId } = await params
  const session = await getBookableSession(sessionId)
  if (!session) {
    return { title: "Book a class — The Wellness Korea" }
  }
  const { heading, timeRange } = formatBookingDateTime(
    session.starts_at,
    session.ends_at,
  )

  return socialMetadata({
    title: session.title,
    pageTitle: `Reserve ${session.title} — The Wellness Korea`,
    // A shared class link is usually "let's go to this" — the date is the
    // thing the other person needs before they can answer.
    description: `${heading} · ${timeRange} · Brickwell, Seochon`,
    image: getSessionPhotoUrl(session.image_paths?.[0]),
    path: `/book/${sessionId}`,
  })
}

export default async function BookSessionPage({
  params,
  searchParams,
}: BookSessionPageProps) {
  const { sessionId } = await params
  const initialCoupon = couponFromParam((await searchParams)[COUPON_PARAM])
  const session = await getBookableSession(sessionId)

  if (!session) {
    notFound()
  }

  const classItem = mapSessionToClassItem(session)
  const isFull = classItem.spots === 0

  const memberSession = await getOptionalMemberSession()
  const memberRole = memberSession?.user.app_metadata?.role
  const isMember =
    memberSession &&
    (isMemberAuthUser(memberSession.user.app_metadata as Record<string, unknown>) ||
      memberSession.user.user_metadata?.signup_intent === "member")

  let memberPrefill: { name: string; email: string; phone?: string | null } | null =
    null

  if (isMember && memberSession) {
    const profile = await getMemberProfileForUser(memberSession.userId)
    memberPrefill = {
      name: profile?.name ?? memberSession.userEmail.split("@")[0],
      email: memberSession.userEmail,
      phone: profile?.phone,
    }
  }

  if (isFull) {
    return (
      <BookingPageLayout
        eyebrow="Waitlist"
        title="This class is full."
        description="Join the waitlist and we'll notify you as soon as a spot opens up."
      >
        <WaitlistForm session={session} memberPrefill={memberPrefill} />
      </BookingPageLayout>
    )
  }

  return (
    <BookingPageLayout
      eyebrow="Reservation"
      title="Reserve your place."
      description={
        isMember
          ? "You're signed in. Confirm your details to complete the reservation."
          : "Guest booking — no account required. We'll send a confirmation email with a link to cancel if your plans change."
      }
    >
      <GuestBookingForm
        session={session}
        memberPrefill={memberPrefill}
        initialCoupon={initialCoupon}
      />
    </BookingPageLayout>
  )
}
