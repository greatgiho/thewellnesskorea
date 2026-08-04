"use server"

import { siteOrigin } from "@/lib/site-origin"
import { resolvePartnerLoginDeliveryEmail } from "@/lib/auth/partner-email"
import { isValidEmail } from "@/lib/partners/utils"
import { createServiceClient } from "@/lib/supabase/service"
import { sendEmail } from "@/lib/notifications/email"
import {
  asActionResult,
  UserFacingError,
  type ActionResult,
} from "@/lib/errors"

/**
 * Send a partner sign-in magic link. The email must belong to an approved
 * partner account (guarded); we never create a new account here. The link is
 * generated server-side and delivered to the partner's contact email
 * (partners.email) — so a test account whose login email is undeliverable just
 * carries a deliverable address in that field. The link still signs in as the
 * login account; the delivery address is only the channel.
 */
async function requestPartnerLoginLinkCore(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase()
  if (!isValidEmail(normalized)) {
    throw new UserFacingError("Please enter a valid email address.")
  }

  const deliveryEmail = await resolvePartnerLoginDeliveryEmail(normalized)

  const admin = createServiceClient()
  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalized,
  })

  // Build the link against our own /auth/callback with token_hash — verifyOtp
  // works server-side on any device. (The raw action_link is Supabase's
  // /auth/v1/verify URL, which redirects tokens in a URL hash our server
  // callback can't read, so it fell through to the homepage.)
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    throw new Error(error?.message ?? "Failed to create a sign-in link.")
  }
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "magiclink",
    next: "/p",
  })
  const link = `${siteOrigin()}/auth/callback?${params.toString()}`

  const subject = `[파트너 로그인] ${normalized} 계정 로그인 링크`
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
      <p><strong>${normalized}</strong> 계정으로 파트너 포털에 로그인합니다.</p>
      <p style="margin:24px 0">
        <a href="${link}"
           style="display:inline-block;background:#111;color:#fff;padding:12px 20px;border-radius:9999px;text-decoration:none">
          로그인하기
        </a>
      </p>
      <p style="color:#666;font-size:12px">이 링크는 위 계정으로만 로그인되며, 한 번만 사용할 수 있습니다.</p>
    </div>
  `
  await sendEmail(deliveryEmail, subject, html, "partner-login")
}

export async function requestPartnerLoginLink(
  email: string,
): Promise<ActionResult> {
  return asActionResult(
    "requestPartnerLoginLink",
    "Failed to send the sign-in link. Please try again.",
    () => requestPartnerLoginLinkCore(email),
  )
}
