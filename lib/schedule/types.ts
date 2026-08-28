import type { PathKey } from "@/lib/paths/paths-data"
import type { SessionPaymentMethod } from "@/lib/payments/money"

export type SessionStatus = "processing" | "confirmed" | "cancelled"

export type Currency = "KRW" | "USD"

export type ScheduleViewMode = "agenda" | "week" | "month"

export type SessionDescriptionBlocks = {
  intro: string
  progress: string
  preparation: string
}

export type FloorRow = {
  id: string
  experience_id: string
  slug: string
  level: number
  name_ko: string
  name_en: string
  sort_order: number
}

export type SessionRow = {
  id: string
  experience_id: string
  floor_id: string
  is_all_floors: boolean
  instructor_id: string
  partner_program_id: string | null
  title: string
  /** One or two lines for list cards. Empty = the card shows no summary. */
  blurb_en: string | null
  blurb_ko: string | null
  path_keys: PathKey[]
  starts_at: string
  ends_at: string
  capacity: number
  booked_count: number
  price_currency: Currency
  price_amount: number
  /** Null = this class has no child rate. 0 = children attend free. */
  child_price_amount: number | null
  /** Pay now, or pay at the door. See 058_session_payment_method.sql. */
  payment_method: SessionPaymentMethod
  discount_type: "fixed" | "percent" | null
  discount_value: number | null
  /** Null when the class has no code of its own. Loaded when the dialog opens. */
  coupon: SessionCouponInput | null
  is_published: boolean
  /** false = bookable by direct link, kept off every public list. See 060. */
  is_listed: boolean
  status: SessionStatus
  slot_lane: number
  confirmed_at: string | null
  confirmed_by: string | null
  created_by: string | null
  created_by_email: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  cancel_reason: string | null
  image_paths: string[]
  description_blocks: SessionDescriptionBlocks
  created_at: string
  updated_at: string
}

/**
 * A priced section of a class: R석, S석.
 *
 * Capacity lives here rather than only on the session because selling out R
 * does not free up S. A class with no tiers has none of these rows and is
 * priced from the session itself.
 */
export type SeatTier = {
  id: string
  code: string
  name: string | null
  capacity: number
  booked_count: number
  price_amount: number
  child_price_amount: number | null
  sort_order: number
}

export type SessionWithRelations = SessionRow & {
  tiers?: SeatTier[]
  floor?: FloorRow
  instructor?: {
    id: string
    name_ko: string
    name_en: string
    role_ko: string
    role_en: string
  }
}

/**
 * A session row as PostgREST hands it back, relations and all.
 *
 * Every caller of toSessionWithRelations() was spelling this out inline, so
 * adding one embedded relation broke five casts at once. Named here so the
 * next one does not.
 */
/** A tier as the admin form holds it; `id` is absent until it is saved. */
export type SeatTierInput = {
  id?: string
  code: string
  name: string
  capacity: number
  price_amount: number
  child_price_amount: number | null
}

export type SessionRelationRow = SessionRow & {
  floor?: FloorRow | FloorRow[] | null
  instructor?:
    | SessionWithRelations["instructor"]
    | SessionWithRelations["instructor"][]
    | null
  tiers?: SeatTier[] | null
}

/**
 * The one discount code a class may carry, edited from its pricing panel.
 *
 * Deliberately fewer knobs than a full coupon: no window, no caps, no
 * currency of its own. Those exist on /a/coupons, and a code made here can be
 * opened there to gain them. See app/a/schedule/coupon-actions.
 */
export type SessionCouponInput = {
  code: string
  discount_type: "fixed" | "percent"
  discount_value: number
}

export type SessionFormInput = {
  floor_id: string
  is_all_floors: boolean
  instructor_id: string
  partner_program_id: string | null
  title: string
  blurb_en: string
  blurb_ko: string
  path_keys: PathKey[]
  date: string
  start_time: string
  end_time: string
  capacity: number
  price_currency: Currency
  price_amount: number
  child_price_amount: number | null
  payment_method: SessionPaymentMethod
  /** Empty = one price for the class. Otherwise capacity is their sum. */
  tiers: SeatTierInput[]
  discount_type: "fixed" | "percent" | null
  discount_value: number | null
  /** Null when the class has no code of its own. Loaded when the dialog opens. */
  coupon: SessionCouponInput | null
  is_published: boolean
  is_listed: boolean
  status: SessionStatus
  image_paths: string[]
  description_blocks: SessionDescriptionBlocks
}

export type SlotClickPayload = {
  floorId: string
  time: string
}
