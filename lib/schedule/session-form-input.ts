import {
  applyDiscount,
  discountFrom,
  money,
  type PricedMoney,
} from "@/lib/payments/money"
import { EMPTY_SESSION_DESCRIPTION } from "@/lib/schedule/images"
import type { SessionFormInput, SessionWithRelations } from "@/lib/schedule/types"
import { defaultEndTime, formatTimeInKst } from "@/lib/schedule/utils"

/**
 * Turning a session row into form values, and back into what the admin sees.
 *
 * Pure, and out of the hook, because these are the rules that have actually
 * bitten: a blank child price is not a free one, the two discount columns have
 * to travel together, and a class with grades has no capacity of its own.
 * Inside a React hook none of that could be tested; here each rule is a case.
 */

/** A brand-new class, before anyone has typed anything. */
export function defaultInput(
  dateKey: string,
  floorId: string,
  startTime: string,
): SessionFormInput {
  return {
    floor_id: floorId,
    is_all_floors: false,
    instructor_id: "",
    partner_program_id: null,
    title: "",
    blurb_en: "",
    blurb_ko: "",
    path_keys: [],
    date: dateKey,
    start_time: startTime,
    end_time: defaultEndTime(startTime, 60),
    capacity: 12,
    price_currency: "USD",
    price_amount: 0,
    child_price_amount: null,
    payment_method: "online",
    tiers: [],
    discount_type: null,
    discount_value: null,
    coupon: null,
    is_published: false,
    is_listed: true,
    status: "processing",
    image_paths: [],
    description_blocks: { ...EMPTY_SESSION_DESCRIPTION },
  }
}

/**
 * An existing class, as form values.
 *
 * Numbers arrive from PostgREST as strings for numeric columns, so every money
 * field goes through Number() rather than being trusted — a price compared as
 * "30" instead of 30 is a bug that only shows up on the second edit.
 *
 * child_price_amount keeps its null. Blank means the class has no child rate
 * and the booking form offers no child option; 0 means children attend free.
 * Collapsing the two would quietly start charging nothing to everyone's kids.
 *
 * The date comes from the caller, not the row: the dialog is opened on a day
 * in the schedule, and that is the day being edited.
 */
export function inputFromSession(
  session: SessionWithRelations,
  dateKey: string,
): SessionFormInput {
  return {
    floor_id: session.floor_id,
    is_all_floors: session.is_all_floors ?? false,
    instructor_id: session.instructor_id,
    partner_program_id: session.partner_program_id,
    title: session.title,
    blurb_en: session.blurb_en ?? "",
    blurb_ko: session.blurb_ko ?? "",
    path_keys: session.path_keys ?? [],
    date: dateKey,
    start_time: formatTimeInKst(session.starts_at),
    end_time: formatTimeInKst(session.ends_at),
    capacity: session.capacity,
    price_currency: session.price_currency ?? "USD",
    price_amount: Number(session.price_amount ?? 0),
    child_price_amount:
      session.child_price_amount != null
        ? Number(session.child_price_amount)
        : null,
    payment_method: session.payment_method === "onsite" ? "onsite" : "online",
    tiers: (session.tiers ?? []).map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name ?? "",
      capacity: t.capacity,
      price_amount: Number(t.price_amount ?? 0),
      child_price_amount:
        t.child_price_amount != null ? Number(t.child_price_amount) : null,
    })),
    discount_type: session.discount_type ?? null,
    discount_value:
      session.discount_value != null ? Number(session.discount_value) : null,
    // Not on the session row — the dialog loads it separately once open.
    coupon: null,
    is_published: session.is_published,
    is_listed: session.is_listed ?? true,
    status: session.status ?? "confirmed",
    image_paths: session.image_paths ?? [],
    description_blocks: session.description_blocks ?? {
      ...EMPTY_SESSION_DESCRIPTION,
    },
  }
}

/**
 * The number of seats the class actually has.
 *
 * A tiered class does not have a capacity of its own — it has the sum of its
 * grades, which is the same rule the database enforces. Letting the admin type
 * a second number would give the form two answers to one question.
 */
export function effectiveCapacityOf(input: SessionFormInput): number {
  return input.tiers.length > 0
    ? input.tiers.reduce((n, t) => n + t.capacity, 0)
    : input.capacity
}

/**
 * What the customer will see for an adult, through the same applyDiscount()
 * the booking screens use. Null when there is no discount to show.
 */
export function discountPreviewOf(input: SessionFormInput): PricedMoney | null {
  const discount = discountFrom(input.discount_type, input.discount_value)
  if (!discount) return null
  return applyDiscount(money(input.price_currency, input.price_amount), discount)
}

/**
 * The same discount off the child rate.
 *
 * Its own line because the adult preview says nothing about what a child ends
 * up paying, and that is the number a parent will hold us to.
 */
export function childPreviewOf(input: SessionFormInput): PricedMoney | null {
  if (input.child_price_amount === null) return null
  return applyDiscount(
    money(input.price_currency, input.child_price_amount),
    discountFrom(input.discount_type, input.discount_value),
  )
}
