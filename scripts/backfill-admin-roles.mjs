/**
 * Backfill app_metadata.role = "admin" for legacy accounts (unset role).
 *
 * Skips users who already have role "teacher" or "member", or signup_intent "member".
 * Does NOT overwrite existing roles.
 *
 * Usage:
 *   npm run backfill-admin-roles              # dry-run (preview only)
 *   npm run backfill-admin-roles -- --apply   # write changes
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local")
  if (!existsSync(path)) return
  const content = readFileSync(path, "utf8")
  for (const line of content.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("#")) continue
    const eq = trimmed.indexOf("=")
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "")
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvLocal()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const apply = process.argv.includes("--apply")

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

function shouldBackfill(user) {
  const role = user.app_metadata?.role
  if (role === "teacher" || role === "member" || role === "admin") {
    return { ok: false, reason: `already ${role}` }
  }
  if (user.user_metadata?.signup_intent === "member") {
    return { ok: false, reason: "member signup_intent" }
  }
  if (typeof role === "string" && role.length > 0) {
    return { ok: false, reason: `unknown role "${role}"` }
  }
  return { ok: true, reason: "unset role" }
}

const allUsers = []
let page = 1

while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
  if (error) {
    console.error("Failed to list users:", error.message)
    process.exit(1)
  }
  allUsers.push(...data.users)
  if (data.users.length < 200) break
  page += 1
}

const toUpdate = []
const skipped = []

for (const user of allUsers) {
  const check = shouldBackfill(user)
  if (check.ok) {
    toUpdate.push(user)
  } else {
    skipped.push({ email: user.email, reason: check.reason })
  }
}

console.log(`Found ${allUsers.length} auth user(s).\n`)

if (skipped.length > 0) {
  console.log("Skipped:")
  for (const row of skipped) {
    console.log(`  - ${row.email ?? "(no email)"} (${row.reason})`)
  }
  console.log()
}

if (toUpdate.length === 0) {
  console.log("Nothing to backfill.")
  process.exit(0)
}

console.log(`${apply ? "Updating" : "Would update"} ${toUpdate.length} user(s) → role: admin:`)
for (const user of toUpdate) {
  console.log(`  - ${user.email ?? user.id}`)
}

if (!apply) {
  console.log("\nDry run only. Re-run with --apply to write changes:")
  console.log("  npm run backfill-admin-roles -- --apply")
  process.exit(0)
}

console.log()
let failed = 0

for (const user of toUpdate) {
  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    app_metadata: { ...user.app_metadata, role: "admin" },
  })
  if (error) {
    failed += 1
    console.error(`  ✗ ${user.email}: ${error.message}`)
  } else {
    console.log(`  ✓ ${user.email}`)
  }
}

if (failed > 0) {
  console.error(`\n${failed} update(s) failed.`)
  process.exit(1)
}

console.log("\nDone. Users may need to sign out and sign in again for JWT refresh.")
