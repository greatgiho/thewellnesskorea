"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import {
  createSiteAccessCookieValue,
  isSiteAccessEnabled,
  safeNextPath,
  SITE_ACCESS_COOKIE,
  SITE_ACCESS_COOKIE_MAX_AGE,
} from "@/lib/site-access"

export type SiteUnlockState = {
  error?: string
}

export async function unlockSite(
  _prev: SiteUnlockState,
  formData: FormData,
): Promise<SiteUnlockState> {
  const password = String(formData.get("password") ?? "").trim()
  const next = safeNextPath(String(formData.get("next") ?? ""))

  if (!isSiteAccessEnabled()) redirect(next)

  const expected = process.env.SITE_ACCESS_PASSWORD
  if (!expected || password !== expected) {
    return { error: "Incorrect password." }
  }

  const token = await createSiteAccessCookieValue(expected)
  const cookieStore = await cookies()
  cookieStore.set(SITE_ACCESS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SITE_ACCESS_COOKIE_MAX_AGE,
    path: "/",
  })

  redirect(next)
}
