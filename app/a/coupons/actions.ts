"use server"

import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/auth/require-session"
import type { DiscountType } from "@/lib/payments/money"

export type CouponInput = {
  code: string
  discountType: DiscountType
  discountValue: number
  currency: "KRW" | "USD" | null
  startsAt: string | null
  endsAt: string | null
  maxRedemptions: number | null
  maxPerUser: number | null
  isActive: boolean
  note: string | null
}

export type CouponSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string }

/**
 * The database enforces all of these. Repeating them here turns a constraint
 * violation into a sentence the admin can act on.
 */
function validate(input: CouponInput): string | null {
  if (!input.code.trim()) return "코드를 입력하세요."
  if (!/^[A-Za-z0-9_-]+$/.test(input.code.trim())) {
    return "코드는 영문·숫자·하이픈·밑줄만 사용할 수 있습니다."
  }
  if (!(input.discountValue > 0)) return "할인 값은 0보다 커야 합니다."
  if (input.discountType === "percent" && input.discountValue > 100) {
    return "정률 할인은 100%를 넘을 수 없습니다."
  }
  if (input.discountType === "fixed" && !input.currency) {
    return "정액 할인은 통화를 지정해야 합니다."
  }
  if (input.startsAt && input.endsAt && input.startsAt > input.endsAt) {
    return "시작일이 종료일보다 늦을 수 없습니다."
  }
  if (input.maxRedemptions !== null && input.maxRedemptions <= 0) {
    return "전체 사용 한도는 1 이상이어야 합니다."
  }
  if (input.maxPerUser !== null && input.maxPerUser <= 0) {
    return "1인 사용 한도는 1 이상이어야 합니다."
  }
  return null
}

function toRow(input: CouponInput) {
  return {
    code: input.code.trim().toUpperCase(),
    discount_type: input.discountType,
    discount_value: input.discountValue,
    // A percentage has no currency of its own; storing one would imply the
    // coupon is currency-scoped when it is not.
    currency: input.discountType === "fixed" ? input.currency : null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    max_redemptions: input.maxRedemptions,
    max_per_user: input.maxPerUser,
    is_active: input.isActive,
    note: input.note?.trim() || null,
  }
}

export async function saveCoupon(
  input: CouponInput,
  couponId?: string,
): Promise<CouponSaveResult> {
  const { supabase } = await requireAdminSession()

  const problem = validate(input)
  if (problem) return { ok: false, error: problem }

  const row = toRow(input)

  const query = couponId
    ? supabase.from("coupons").update(row).eq("id", couponId).select("id").maybeSingle()
    : supabase.from("coupons").insert(row).select("id").maybeSingle()

  const { data, error } = await query
  if (error) {
    // The unique index is on upper(btrim(code)), so a clash here means the
    // code already exists in some other casing.
    if (error.code === "23505") {
      return { ok: false, error: "이미 존재하는 코드입니다." }
    }
    return { ok: false, error: error.message }
  }
  if (!data?.id) return { ok: false, error: "쿠폰을 저장하지 못했습니다." }

  revalidatePath("/a/coupons")
  revalidatePath(`/a/coupons/${data.id}`)
  return { ok: true, id: data.id }
}

/**
 * Turn a coupon off without deleting it — the redemptions already recorded
 * against it stay readable, which deleting would take with them.
 */
export async function setCouponActive(
  couponId: string,
  isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await requireAdminSession()

  const { error } = await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId)

  if (error) return { ok: false, error: error.message }

  revalidatePath("/a/coupons")
  revalidatePath(`/a/coupons/${couponId}`)
  return { ok: true }
}
