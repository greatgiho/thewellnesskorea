import { UserFacingError } from "@/lib/errors"
import type { SessionFormInput } from "@/lib/schedule/types"
import { isWithinOperatingHours, toKstIso } from "@/lib/schedule/utils"

/**
 * Form-level rules for a session, checked before anything is written.
 *
 * The database enforces the discount rules too; repeating them here turns a
 * constraint violation into a message an admin can act on.
 */

export function validateDiscount(input: SessionFormInput): void {
  const { discount_type, discount_value } = input

  if (discount_type === null) {
    if (discount_value !== null) {
      throw new UserFacingError("Choose a discount type or clear the value.")
    }
    return
  }

  if (discount_value === null || discount_value <= 0) {
    throw new UserFacingError("Discount value must be greater than 0.")
  }
  if (discount_type === "percent" && discount_value > 100) {
    throw new UserFacingError("A percentage discount cannot exceed 100%.")
  }
  if (discount_type === "fixed" && discount_value > input.price_amount) {
    throw new UserFacingError("A fixed discount cannot exceed the price.")
  }
}

export function validateSessionInput(input: SessionFormInput): {
  starts_at: string
  ends_at: string
} {
  if (!input.title.trim()) throw new UserFacingError("Session title is required.")
  if (input.capacity <= 0) throw new UserFacingError("Capacity must be greater than 0.")
  if (input.price_amount < 0) throw new UserFacingError("Price cannot be negative.")
  validateDiscount(input)
  if (input.path_keys.length === 0) {
    throw new UserFacingError("Select at least one philosophy path.")
  }
  if (input.image_paths.length > 3) {
    throw new UserFacingError("Maximum 3 images per session.")
  }
  if (!isWithinOperatingHours(input.date, input.start_time, input.end_time)) {
    throw new UserFacingError("Session must be within operating hours (06:00–24:00).")
  }
  if (input.status === "processing" && input.is_published) {
    throw new UserFacingError("Only confirmed sessions can be published.")
  }

  const starts_at = toKstIso(input.date, input.start_time)
  const ends_at = toKstIso(input.date, input.end_time)

  if (new Date(ends_at) <= new Date(starts_at)) {
    throw new UserFacingError("End time must be after start time.")
  }

  return { starts_at, ends_at }
}
