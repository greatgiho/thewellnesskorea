import type { SessionStatus } from "./types"

export const SESSION_STATUS_LABELS: Record<
  SessionStatus,
  { ko: string; en: string }
> = {
  processing: { ko: "협의 중", en: "Processing" },
  confirmed: { ko: "확정", en: "Confirmed" },
  cancelled: { ko: "취소", en: "Cancelled" },
}

export const SESSION_STATUS_RIBBON_CLASS: Record<SessionStatus, string> = {
  processing: "bg-amber-400 text-amber-950",
  confirmed: "bg-blue-600 text-white",
  cancelled: "bg-muted text-muted-foreground",
}

export function sessionStatusLabel(status: SessionStatus): string {
  return SESSION_STATUS_LABELS[status]?.en ?? status
}
