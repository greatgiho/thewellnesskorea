/**
 * Set app_metadata.role = "admin" on an existing Supabase Auth user.
 *
 * Usage:
 *   npm run set-admin-role -- admin@thewellnesskorea.com
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
const email = process.argv[2]

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

if (!email) {
  console.error("Usage: npm run set-admin-role -- your@email.com")
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const normalized = email.trim().toLowerCase()
let page = 1
let user = null

while (!user) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
  if (error) {
    console.error("Failed to list users:", error.message)
    process.exit(1)
  }
  user = data.users.find((row) => row.email?.toLowerCase() === normalized) ?? null
  if (user || data.users.length < 200) break
  page += 1
}

if (!user) {
  console.error(`No auth user found for: ${email}`)
  process.exit(1)
}

const currentRole = user.app_metadata?.role
if (currentRole === "teacher") {
  console.error("This account is a teacher. Use a separate admin email.")
  process.exit(1)
}
if (currentRole === "member") {
  console.error("This account is a member. Use a separate admin email.")
  process.exit(1)
}

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  app_metadata: { ...user.app_metadata, role: "admin" },
})

if (updateError) {
  console.error("Failed to set admin role:", updateError.message)
  process.exit(1)
}

console.log("Admin role set successfully.")
console.log("  Email:", user.email)
console.log("  User ID:", user.id)
console.log("  Previous role:", currentRole ?? "(unset)")
console.log("\nLog in at http://localhost:3000/admin/login")
