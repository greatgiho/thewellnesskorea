export const SCHEDULE_START_HOUR = 6
export const SCHEDULE_END_HOUR = 24
export const SLOT_MINUTES = 30
export const SLOT_HEIGHT_PX = 28
export const KST_TIMEZONE = "Asia/Seoul"

export const SESSION_SELECT =
  "id, experience_id, floor_id, is_all_floors, instructor_id, partner_program_id, title, blurb_en, blurb_ko, path_keys, starts_at, ends_at, capacity, booked_count, price_currency, price_amount, child_price_amount, payment_method, discount_type, discount_value, is_published, status, slot_lane, confirmed_at, confirmed_by, created_by, created_by_email, cancelled_at, cancelled_by, cancel_reason, image_paths, description_blocks, created_at, updated_at"

export const SESSION_TIER_SELECT =
  "id, code, name, capacity, booked_count, price_amount, child_price_amount, sort_order"

export const SESSION_WITH_RELATIONS = `
  ${SESSION_SELECT},
  floor:floors (id, slug, level, name_ko, name_en, sort_order),
  instructor:partners (id, name_ko, name_en, role_ko, role_en),
  tiers:session_tiers (${SESSION_TIER_SELECT})
`
