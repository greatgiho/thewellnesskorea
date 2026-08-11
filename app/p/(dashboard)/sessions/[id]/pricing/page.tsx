import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { requirePartnerSession } from "@/lib/auth/require-partner-session"
import { formatSessionTime } from "@/lib/partner/utils"
import { SessionPricingForm } from "@/components/partner/session-pricing-form"

export const metadata: Metadata = { title: "가격 설정 — Partner" }

type Props = { params: Promise<{ id: string }> }

type Row = {
  id: string
  title: string
  starts_at: string
  ends_at: string
  booked_count: number
  price_currency: "KRW" | "USD"
  price_amount: number
  child_price_amount: number | null
  discount_type: "fixed" | "percent" | null
  discount_value: number | null
}

export default async function SessionPricingPage({ params }: Props) {
  const { id } = await params
  const { supabase, partner } = await requirePartnerSession()

  const { data } = await supabase
    .from("sessions")
    .select(
      "id, title, starts_at, ends_at, booked_count, price_currency, price_amount, child_price_amount, discount_type, discount_value",
    )
    .eq("id", id)
    .eq("instructor_id", partner.id)
    .maybeSingle()

  const session = data as Row | null
  if (!session) notFound()

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/p"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          ← 예정 클래스
        </Link>
        <h1 className="mt-3 font-serif text-3xl text-foreground">가격 설정</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {session.title} · {formatSessionTime(session.starts_at, session.ends_at)}
        </p>
      </div>

      {session.booked_count > 0 ? (
        <p className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 text-sm text-foreground">
          이미 <strong>{session.booked_count}명</strong>이 예약했습니다. 가격을
          바꿔도 <strong>이미 결제된 금액은 그대로</strong>이고, 앞으로의 예약에만
          적용됩니다. 다만 먼저 예약한 분이 더 비싸게 낸 상태가 될 수 있습니다.
        </p>
      ) : null}

      <SessionPricingForm
        sessionId={session.id}
        initial={{
          priceCurrency: session.price_currency ?? "USD",
          priceAmount: Number(session.price_amount ?? 0),
          childPriceAmount:
            session.child_price_amount != null
              ? Number(session.child_price_amount)
              : null,
          discountType: session.discount_type,
          discountValue:
            session.discount_value != null ? Number(session.discount_value) : null,
        }}
      />
    </div>
  )
}
