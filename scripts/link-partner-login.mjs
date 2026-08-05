/**
 * Give an existing partner a login address that is not their delivery address.
 *
 * Partner sign-in already separates the two: the address typed at /p/signin is
 * only an identifier, and resolvePartnerLoginDeliveryEmail sends the magic link
 * to partners.email instead. That is what lets one person hold a partner
 * account and a member account at once — the member keeps the real address
 * (signInWithOtp delivers to the address itself and has no indirection), while
 * the partner logs in under something like abcd@p.example.com.
 *
 * The admin screen cannot set this up. provisionPartnerAccount creates the auth
 * user with partners.email and mails the invite to the same place, so login and
 * delivery come out identical. This script makes the split instead.
 *
 * No password and no invite are issued: partners sign in by magic link, so the
 * account needs nothing beyond existing and being linked. set_partner_invite is
 * the only SECURITY DEFINER path that writes partners.user_id, and it insists on
 * storing a token, so the token written here is already expired — linking is the
 * point, the invite is not.
 *
 * Usage:
 *   node scripts/link-partner-login.mjs --partner "희주" --login huiju@p.example.com
 *   node scripts/link-partner-login.mjs --partner <uuid> --login x@p.example.com --apply
 *   node scripts/link-partner-login.mjs --partner ... --login ... --apply --env .env.dev
 *
 * Reports by default; creates an account only with --apply.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the env file.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"
import { randomBytes, createHash } from "crypto"

const args = process.argv.slice(2)
const apply = args.includes("--apply")

function flag(name) {
  const at = args.indexOf(name)
  if (at === -1) return null
  const value = args[at + 1]
  if (!value || value.startsWith("--")) {
    console.error(`${name} needs a value`)
    process.exit(1)
  }
  return value
}

const envFile = flag("--env") ?? ".env.local"
const partnerRef = flag("--partner")
const loginEmail = flag("--login")?.trim().toLowerCase()

if (!partnerRef || !loginEmail) {
  console.error(
    "usage: link-partner-login.mjs --partner <uuid|name|email> --login <address> [--apply] [--env FILE]",
  )
  process.exit(1)
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(loginEmail)) {
  console.error(`not an email address: ${loginEmail}`)
  process.exit(1)
}

function loadEnv(file) {
  const path = resolve(process.cwd(), file)
  if (!existsSync(path)) {
    console.error(`missing env file: ${file}`)
    process.exit(1)
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    process.env[key] = value
  }
}

loadEnv(envFile)

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error(`${envFile} needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`)
  process.exit(1)
}
const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Resolve --partner by id, then exact email, then name. Ambiguity is an error. */
async function findPartner(ref) {
  const columns = "id, name_ko, name_en, email, user_id, registration_status"
  if (isUuid.test(ref)) {
    const { data, error } = await supabase
      .from("partners")
      .select(columns)
      .eq("id", ref)
      .maybeSingle()
    if (error) throw new Error(error.message)
    return data ? [data] : []
  }
  const { data, error } = await supabase
    .from("partners")
    .select(columns)
    .or(`email.ilike.${ref},name_ko.ilike.${ref},name_en.ilike.${ref}`)
  if (error) throw new Error(error.message)
  return data ?? []
}

async function findAuthUserByEmail(email) {
  let page = 1
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const hit = data.users.find((u) => u.email?.toLowerCase() === email)
    if (hit) return hit
    if (data.users.length < 200) return null
    page += 1
  }
}

const matches = await findPartner(partnerRef)
if (matches.length === 0) {
  console.error(`no partner matches: ${partnerRef}`)
  process.exit(1)
}
if (matches.length > 1) {
  console.error(`${matches.length} partners match "${partnerRef}" — pass an id instead:`)
  for (const p of matches) console.error(`  ${p.id}  ${p.name_ko}  ${p.email ?? "(no email)"}`)
  process.exit(1)
}
const partner = matches[0]

console.log(`env      ${envFile}  (${url})`)
console.log(`partner  ${partner.name_ko} / ${partner.name_en}  ${partner.id}`)
console.log(`status   ${partner.registration_status}`)
console.log(`login    ${loginEmail}          <- typed at /p/signin`)
console.log(`delivery ${partner.email ?? "(none)"}   <- magic link goes here`)
console.log("")

// set_partner_invite links with coalesce(user_id, p_user_id), so an already
// linked partner would silently keep the old account. Say so instead.
if (partner.user_id) {
  console.error(
    `refusing: this partner is already linked to auth user ${partner.user_id}.\n` +
      `Unlink it first if you really mean to move the login address.`,
  )
  process.exit(1)
}
// Without a delivery address the magic link has nowhere to go, and sign-in
// fails with "This partner has no contact email set."
if (!partner.email || !partner.email.trim()) {
  console.error(
    "refusing: partners.email is empty, so the magic link would have nowhere to go.\n" +
      "Set the partner's real address first — that is what makes the split useful.",
  )
  process.exit(1)
}
if (partner.email.trim().toLowerCase() === loginEmail) {
  console.error(
    "refusing: login and delivery address are the same, which is what the admin\n" +
      "screen already does. Use provisionPartnerAccount for that case.",
  )
  process.exit(1)
}

const taken = await findAuthUserByEmail(loginEmail)
if (taken) {
  console.error(`refusing: ${loginEmail} already belongs to auth user ${taken.id}.`)
  process.exit(1)
}

if (!apply) {
  console.log("(report only — re-run with --apply to create the account)")
  process.exit(0)
}

const { data: created, error: createError } = await supabase.auth.admin.createUser({
  email: loginEmail,
  email_confirm: true,
  app_metadata: { role: "partner" },
  user_metadata: { name: partner.name_ko },
})
if (createError) {
  console.error(`createUser failed: ${createError.message}`)
  process.exit(1)
}

const expiredToken = createHash("sha256").update(randomBytes(32)).digest("hex")
const { error: linkError } = await supabase.rpc("set_partner_invite", {
  p_person_id: partner.id,
  p_user_id: created.user.id,
  p_token_hash: expiredToken,
  p_expires_at: new Date(Date.now() - 60_000).toISOString(),
})
if (linkError) {
  // Roll back rather than leave an auth account no partner row points at.
  await supabase.auth.admin.deleteUser(created.user.id)
  console.error(`set_partner_invite failed (auth user rolled back): ${linkError.message}`)
  process.exit(1)
}

const { data: after, error: afterError } = await supabase
  .from("partners")
  .select("user_id, email")
  .eq("id", partner.id)
  .maybeSingle()
if (afterError) throw new Error(afterError.message)

if (after?.user_id !== created.user.id) {
  console.error(
    `link did not take: partners.user_id is ${after?.user_id ?? "null"}, expected ${created.user.id}`,
  )
  process.exit(1)
}

console.log(`linked   auth user ${created.user.id}`)
console.log(`verified partners.user_id matches, delivery still ${after.email}`)
console.log("")
console.log(`The partner signs in at /p/signin by typing ${loginEmail};`)
console.log(`the link arrives at ${after.email}. No password was set.`)
