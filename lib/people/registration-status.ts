import type { PersonRegistrationStatus } from "./types"

export const REGISTRATION_STATUS_LABELS: Record<
  PersonRegistrationStatus,
  { ko: string; en: string }
> = {
  admin: { ko: "어드민 등록", en: "Admin" },
  draft: { ko: "작성 중", en: "Draft" },
  submitted: { ko: "검토 대기", en: "Pending review" },
  approved: { ko: "승인됨", en: "Approved" },
  rejected: { ko: "반려", en: "Rejected" },
}

export const REGISTRATION_STATUS_BADGE_CLASS: Record<
  PersonRegistrationStatus,
  string
> = {
  admin: "bg-muted text-muted-foreground",
  draft: "bg-secondary text-muted-foreground",
  submitted: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  approved: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  rejected: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
}

export function registrationStatusLabel(
  status: PersonRegistrationStatus,
  locale: "ko" | "en" = "en",
): string {
  return REGISTRATION_STATUS_LABELS[status]?.[locale] ?? status
}

export function canPublishPerson(status: PersonRegistrationStatus): boolean {
  return status === "admin" || status === "approved"
}

export function isSelfRegistered(
  status: PersonRegistrationStatus,
  userId?: string | null,
): boolean {
  if (status === "admin") return false
  // Legacy rows: approved without auth link were admin/seed data (migration 007).
  if (status === "approved" && !userId) return false
  return true
}
