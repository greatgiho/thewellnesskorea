import { UserFacingError } from "@/lib/errors"
import { createServiceClient } from "@/lib/supabase/service"

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function assertPartnerEmailUnique(
  email: string,
  excludePartnerId?: string,
): Promise<void> {
  const normalized = normalizeEmail(email)
  if (!normalized) return

  const admin = createServiceClient()
  let query = admin.from("partners").select("id").ilike("email", normalized)
  if (excludePartnerId) query = query.neq("id", excludePartnerId)

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  if (data) {
    throw new UserFacingError(
      "This email is already registered to another partner profile.",
    )
  }
}

export function throwPartnerPersistError(error: {
  message: string
  code?: string
}): never {
  if (
    error.code === "23505" &&
    error.message.includes("people_email_unique_idx")
  ) {
    throw new UserFacingError(
      "This email is already registered to another partner profile.",
    )
  }
  throw new Error(error.message)
}
