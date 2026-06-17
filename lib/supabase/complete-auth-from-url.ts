import type { EmailOtpType, SupabaseClient } from "@supabase/supabase-js"

export async function completeAuthFromUrl(
  supabase: SupabaseClient,
  params: URLSearchParams,
): Promise<{ ok: boolean; error?: string }> {
  const tokenHash = params.get("token_hash")
  const type = params.get("type") as EmailOtpType | null

  // token_hash: works on any device/browser (no PKCE cookie required)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    })
    return { ok: !error, error: error?.message }
  }

  // code: PKCE flow — requires auth cookies from the browser that requested the link
  const code = params.get("code")
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    return { ok: !error, error: error?.message }
  }

  return { ok: false, error: "missing_auth_params" }
}
