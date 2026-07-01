const KST = "Asia/Seoul"

function toKST(iso: string): Date {
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: KST }))
}

export function formatSessionTime(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)

  const dateStr = start.toLocaleDateString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
  const startTime = start.toLocaleTimeString("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
  })
  const endTime = end.toLocaleTimeString("ko-KR", {
    timeZone: KST,
    hour: "2-digit",
    minute: "2-digit",
  })

  return `${dateStr} ${startTime} – ${endTime}`
}

export function formatDateOnly(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: KST,
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  })
}

export function isSessionEnded(endsAt: string): boolean {
  return new Date(endsAt) < new Date()
}
