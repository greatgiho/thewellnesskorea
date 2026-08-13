import type {
  SessionDescriptionBlocks,
  SessionFormInput,
} from "@/lib/schedule/types"

/** Form input -> the shape the sessions table expects. */

export function trimDescriptionBlocks(
  blocks: SessionDescriptionBlocks,
): SessionDescriptionBlocks {
  return {
    intro: blocks.intro.trim(),
    progress: blocks.progress.trim(),
    preparation: blocks.preparation.trim(),
  }
}

export function sessionRowFromInput(
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
  slot_lane: number,
  experience_id: string,
) {
  return {
    experience_id,
    floor_id: input.floor_id,
    is_all_floors: input.is_all_floors,
    instructor_id: input.instructor_id,
    partner_program_id: input.partner_program_id || null,
    title: input.title.trim(),
    // Empty string and null mean the same thing to the card, but null is what
    // "nobody wrote one" looks like in the column.
    blurb_en: input.blurb_en.trim() || null,
    blurb_ko: input.blurb_ko.trim() || null,
    path_keys: input.path_keys,
    starts_at,
    ends_at,
    capacity: input.capacity,
    price_currency: input.price_currency,
    price_amount: input.price_amount,
    child_price_amount: input.child_price_amount,
    discount_type: input.discount_type,
    discount_value: input.discount_value,
    is_published: input.status === "confirmed" ? input.is_published : false,
    status: input.status,
    slot_lane,
    image_paths: input.image_paths,
    description_blocks: trimDescriptionBlocks(input.description_blocks),
  }
}
