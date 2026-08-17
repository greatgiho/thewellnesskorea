import { describe, expect, it } from "vitest"
import {
  childPreviewOf,
  defaultInput,
  discountPreviewOf,
  effectiveCapacityOf,
  inputFromSession,
} from "@/lib/schedule/session-form-input"
import type { SessionWithRelations } from "@/lib/schedule/types"

/**
 * These rules used to live inside a React hook, where none of them could be
 * checked. Each case here is something that would cost money if it changed
 * quietly: what a class costs, how many seats it has, and whether children are
 * charged at all.
 */

// 2026-08-25, 20:00–22:00 KST.
const base = {
  id: "s1",
  experience_id: "e1",
  floor_id: "f1",
  is_all_floors: false,
  instructor_id: "p1",
  partner_program_id: null,
  title: "사운드 배스",
  blurb_en: null,
  blurb_ko: null,
  path_keys: [],
  starts_at: "2026-08-25T11:00:00+00:00",
  ends_at: "2026-08-25T13:00:00+00:00",
  capacity: 20,
  booked_count: 3,
  price_currency: "KRW",
  price_amount: 30000,
  child_price_amount: null,
  payment_method: "online",
  discount_type: null,
  discount_value: null,
  is_published: true,
  is_listed: true,
  status: "confirmed",
  slot_lane: 0,
  confirmed_at: null,
  confirmed_by: null,
  created_by: null,
  created_by_email: null,
  cancelled_at: null,
  cancelled_by: null,
  cancel_reason: null,
  image_paths: [],
  description_blocks: null,
  created_at: "2026-08-01T00:00:00+00:00",
  updated_at: "2026-08-01T00:00:00+00:00",
} as unknown as SessionWithRelations

const session = (over: Partial<SessionWithRelations> = {}) =>
  ({ ...base, ...over }) as SessionWithRelations

describe("inputFromSession", () => {
  it("reads the class times in KST", () => {
    const input = inputFromSession(session(), "2026-08-25")
    expect(input.start_time).toBe("20:00")
    expect(input.end_time).toBe("22:00")
  })

  it("takes the date from the day being edited, not the row", () => {
    // The dialog opens on a day in the schedule. That day is what is being
    // edited — a duplicate opened on another date must not silently keep the
    // original's.
    expect(inputFromSession(session(), "2026-09-01").date).toBe("2026-09-01")
  })

  it("keeps a blank child price blank", () => {
    // Null means the class has no child rate and the booking form offers no
    // child option. Turning it into 0 would start admitting children free.
    expect(inputFromSession(session(), "2026-08-25").child_price_amount).toBe(
      null,
    )
  })

  it("keeps a zero child price at zero", () => {
    // 0 is a real answer: children attend, and they attend free.
    const input = inputFromSession(
      session({ child_price_amount: 0 }),
      "2026-08-25",
    )
    expect(input.child_price_amount).toBe(0)
  })

  it("converts the numbers PostgREST sends as strings", () => {
    // numeric columns come back as strings. A price held as "30000" compares
    // and arithmetics wrong, and only shows up on the second edit.
    const input = inputFromSession(
      session({
        price_amount: "30000" as unknown as number,
        child_price_amount: "15000" as unknown as number,
        discount_type: "percent",
        discount_value: "10" as unknown as number,
      }),
      "2026-08-25",
    )
    expect(input.price_amount).toBe(30000)
    expect(input.child_price_amount).toBe(15000)
    expect(input.discount_value).toBe(10)
  })

  it("carries the grades across, numbers and all", () => {
    const input = inputFromSession(
      session({
        tiers: [
          {
            id: "t1",
            code: "R",
            name: null,
            capacity: 10,
            booked_count: 0,
            price_amount: "100000" as unknown as number,
            child_price_amount: null,
            sort_order: 0,
          },
        ],
      }),
      "2026-08-25",
    )
    expect(input.tiers).toEqual([
      {
        id: "t1",
        code: "R",
        name: "",
        capacity: 10,
        price_amount: 100000,
        child_price_amount: null,
      },
    ])
  })

  it("treats a missing is_listed as listed", () => {
    // The column arrived in 060; a row written before it should not read as a
    // hidden class.
    const input = inputFromSession(
      session({ is_listed: null as unknown as boolean }),
      "2026-08-25",
    )
    expect(input.is_listed).toBe(true)
  })
})

describe("effectiveCapacityOf", () => {
  it("is what was typed when the class has no grades", () => {
    expect(effectiveCapacityOf(defaultInput("2026-08-25", "f1", "09:00"))).toBe(
      12,
    )
  })

  it("is the sum of the grades when it has them", () => {
    // The same rule the database enforces. Two answers to one question is how
    // a class oversells.
    const input = {
      ...defaultInput("2026-08-25", "f1", "09:00"),
      capacity: 999,
      tiers: [
        { code: "R", name: "", capacity: 10, price_amount: 0, child_price_amount: null },
        { code: "S", name: "", capacity: 22, price_amount: 0, child_price_amount: null },
      ],
    }
    expect(effectiveCapacityOf(input)).toBe(32)
  })
})

describe("discountPreviewOf", () => {
  const priced = (over: Record<string, unknown>) => ({
    ...defaultInput("2026-08-25", "f1", "09:00"),
    price_currency: "KRW" as const,
    price_amount: 30000,
    ...over,
  })

  it("is nothing when there is no discount", () => {
    expect(discountPreviewOf(priced({}))).toBe(null)
  })

  it("is nothing when a type was chosen but no value typed yet", () => {
    // discount_value starts at 0 the moment a type is picked. Showing "0% off"
    // to the admin mid-typing would be noise.
    expect(
      discountPreviewOf(priced({ discount_type: "percent", discount_value: 0 })),
    ).toBe(null)
  })

  it("shows what the customer pays", () => {
    const result = discountPreviewOf(
      priced({ discount_type: "percent", discount_value: 20 }),
    )
    expect(result?.final.amount).toBe(24000)
    expect(result?.percentOff).toBe(20)
  })
})

describe("childPreviewOf", () => {
  it("is nothing when the class has no child rate", () => {
    expect(
      childPreviewOf({
        ...defaultInput("2026-08-25", "f1", "09:00"),
        child_price_amount: null,
      }),
    ).toBe(null)
  })

  it("takes the same discount off the child rate", () => {
    // Its own line because the adult preview says nothing about what a child
    // ends up paying, and that is the number a parent will hold us to.
    const result = childPreviewOf({
      ...defaultInput("2026-08-25", "f1", "09:00"),
      price_currency: "KRW",
      price_amount: 30000,
      child_price_amount: 15000,
      discount_type: "percent",
      discount_value: 20,
    })
    expect(result?.final.amount).toBe(12000)
  })

  it("still shows a free child rate", () => {
    // 0 is not "no rate" — the booking form offers a child seat at no charge,
    // and the admin should see that confirmed.
    const result = childPreviewOf({
      ...defaultInput("2026-08-25", "f1", "09:00"),
      price_currency: "KRW",
      child_price_amount: 0,
    })
    expect(result?.final.amount).toBe(0)
  })
})
