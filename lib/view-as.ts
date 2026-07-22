// view-as: admin-only read-only impersonation of a partner/member.
//
// A signed cookie marks the acting admin + the target being viewed. The
// signature (HMAC over the payload with a server-only secret) prevents
// forgery. It is verified in the Edge middleware AND in server code, so this
// uses Web Crypto (crypto.subtle) — same approach as lib/site-access.ts.

export const VIEW_AS_COOKIE = "twk_view_as"
export const VIEW_AS_COOKIE_MAX_AGE = 60 * 60 * 2 // 2 hours

export type ViewAsKind = "partner" | "member"

export type ViewAsPayload = {
  kind: ViewAsKind
  id: string
  adminUserId: string
}

function toBase64Url(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(input: string): string {
  return atob(input.replace(/-/g, "+").replace(/_/g, "/"))
}

async function sign(body: string): Promise<string> {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function encodeViewAs(payload: ViewAsPayload): Promise<string> {
  const body = toBase64Url(JSON.stringify(payload))
  const sig = await sign(body)
  return `${body}.${sig}`
}

export async function decodeViewAs(
  cookieValue: string | undefined | null,
): Promise<ViewAsPayload | null> {
  if (!cookieValue) return null
  const dot = cookieValue.lastIndexOf(".")
  if (dot <= 0) return null
  const body = cookieValue.slice(0, dot)
  const sig = cookieValue.slice(dot + 1)
  if (!timingSafeEqual(sig, await sign(body))) return null
  try {
    const parsed = JSON.parse(fromBase64Url(body)) as ViewAsPayload
    if (
      parsed &&
      (parsed.kind === "partner" || parsed.kind === "member") &&
      typeof parsed.id === "string" &&
      typeof parsed.adminUserId === "string"
    ) {
      return parsed
    }
  } catch {
    // malformed — treat as no view-as
  }
  return null
}
