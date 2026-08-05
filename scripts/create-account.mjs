/**
 * Create (or take over) an account at a given address with a given role.
 *
 * create-admin.mjs only makes admins, and set-admin-role.mjs only promotes an
 * account that already exists, so there was no way to hand a collaborator a
 * read-only login. That is issue #94, and it is also what the per-role address
 * scheme needs: one person holds several accounts, each under its own address,
 * because auth.users.email is unique.
 *
 * Roles differ in what they need:
 *   viewer / admin — password login, so a password is required. The address is
 *                    only an identifier; nothing is ever mailed to it.
 *   member         — magic link (or Google) to the address itself, so the
 *                    address must be real and no password is set.
 *
 * Every account is created with email_confirm, which matters beyond skipping a
 * confirmation mail: Supabase links a later Google sign-in to an existing user
 * only when the address matches and is already confirmed. Observed on the dev
 * clone — one user id holding both an `email` and a `google` identity.
 *
 * --from takes over an existing account instead of creating a new one: same
 * user id, new address and role. Use it when the person already has an account
 * at an address you now want to free up.
 *
 * Usage:
 *   node scripts/create-account.mjs --email a@p.example.com --role viewer --password 'x' --env .env.dev
 *   node scripts/create-account.mjs --email a@example.com --role member --env .env.dev --apply
 *   node scripts/create-account.mjs --email new@a.example.com --role viewer --password 'x' \
 *        --from old@real.com --env .env.www --apply
 *
 * Reports by default; writes only with --apply.
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the env file.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const args = process.argv.slice(2)
const apply = args.includes("--apply")

function flag(name) {
  const at = args.indexOf(name)
  if (at === -1) return null
  const value = args[at + 1]
  if (value === undefined || value.startsWith("--")) {
    console.error(`${name} needs a value`)
    process.exit(1)
  }
  return value
}

const envFile = flag("--env") ?? ".env.local"
const email = flag("--email")?.trim().toLowerCase()
const role = flag("--role")
const password = flag("--password")
const from = flag("--from")?.trim().toLowerCase()

const ROLES = ["viewer", "admin", "member"]

if (!email || !role) {
  console.error(
    "usage: create-account.mjs --email <address> --role <viewer|admin|member> [--password <pw>] [--from <address>] [--apply] [--env FILE]",
  )
  process.exit(1)
}
if (!ROLES.includes(role)) {
  console.error(`--role must be one of: ${ROLES.join(", ")}`)
  process.exit(1)
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error(`not an email address: ${email}`)
  process.exit(1)
}
// A password would never be used: members arrive by magic link or Google.
if (role === "member" && password) {
  console.error("--password is meaningless for a member (magic link / Google only)")
  process.exit(1)
}
if (role !== "member" && !password) {
  console.error(`--password is required for role ${role} (it is a password login)`)
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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !serviceKey) {
  console.error(`${envFile} needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`)
  process.exit(1)
}
const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function findByEmail(address) {
  let page = 1
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    const hit = data.users.find((u) => u.email?.toLowerCase() === address)
    if (hit) return hit
    if (data.users.length < 200) return null
    page += 1
  }
}

const existing = await findByEmail(email)
const source = from ? await findByEmail(from) : null

console.log(`env    ${envFile}  (${url})`)
console.log(`target ${email}  role=${role}`)

if (existing) {
  console.error(
    `refusing: ${email} already exists (user ${existing.id}, role ${existing.app_metadata?.role ?? "none"}).`,
  )
  process.exit(1)
}
if (from && !source) {
  console.error(`refusing: --from ${from} does not exist, nothing to take over.`)
  process.exit(1)
}
if (source) {
  console.log(
    `from   ${from}  (user ${source.id}, role ${source.app_metadata?.role ?? "none"}) — id is kept`,
  )
}

if (!apply) {
  console.log(source ? "(report only — would rename and re-role)" : "(report only — would create)")
  process.exit(0)
}

if (source) {
  const { error } = await supabase.auth.admin.updateUserById(source.id, {
    email,
    email_confirm: true,
    password,
    app_metadata: { role },
  })
  if (error) {
    console.error(`update failed: ${error.message}`)
    process.exit(1)
  }
  console.log(`ok     user ${source.id} is now ${email} / ${role}`)
} else {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    ...(password ? { password } : {}),
    app_metadata: { role },
  })
  if (error) {
    console.error(`create failed: ${error.message}`)
    process.exit(1)
  }
  console.log(`ok     created user ${data.user.id}`)
}

// Read it back: app_metadata writes are merges, and a silent no-op here would
// otherwise look identical to success.
const after = await findByEmail(email)
if (!after || after.app_metadata?.role !== role) {
  console.error(
    `verify failed: ${email} has role ${after?.app_metadata?.role ?? "none"}, expected ${role}`,
  )
  process.exit(1)
}
console.log(`verify ${email} role=${after.app_metadata.role} confirmed=${Boolean(after.email_confirmed_at)}`)
