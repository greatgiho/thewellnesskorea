import type { PartnerFormInput } from "./types"
import { isValidEmail } from "./utils"
import type { RegionsForForms } from "@/lib/regions/types"
import { validateActivityRegionCodes } from "@/lib/regions/validate"

export function validatePersonInput(
  input: PartnerFormInput,
  regions: RegionsForForms,
): void {
  if (!input.name_ko.trim()) {
    throw new Error("Korean name is required.")
  }
  if (!input.name_en.trim()) {
    throw new Error("English name is required.")
  }
  if (!input.role_ko.trim()) {
    throw new Error("Korean role is required.")
  }
  if (!input.role_en.trim()) {
    throw new Error("English role is required.")
  }
  if (!isValidEmail(input.email)) {
    throw new Error("Invalid email format.")
  }
  validateActivityRegionCodes(
    input.primary_region_code,
    input.secondary_region_code,
    regions,
  )
  for (const program of input.programs) {
    if (!program.title.trim()) {
      throw new Error("Each program needs a title.")
    }
    if (program.path_keys.length === 0) {
      throw new Error(
        `Select at least one philosophy path for “${program.title.trim()}”.`,
      )
    }
  }
}
