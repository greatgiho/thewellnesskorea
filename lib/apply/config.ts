export function teacherApplyCode(): string {
  return process.env.TEACHER_APPLY_CODE?.trim() || "twk2026"
}

export function siteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "")
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }
  return "http://localhost:3000"
}

export function applyProfileUrl(): string {
  return `${siteOrigin()}/apply/profile`
}
