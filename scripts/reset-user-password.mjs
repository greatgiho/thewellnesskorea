/**
 * Set a Supabase Auth user's password directly (no recovery email).
 *
 * Usage:
 *   npm run reset-user-password -- mudrasoil.studio@gmail.com NewPassword123
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
const password = process.argv[3]

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

if (!email || !password) {
  console.error(
    "Usage: npm run reset-user-password -- user@email.com NewPassword123",
  )
  process.exit(1)
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters.")
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

const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
})

if (updateError) {
  console.error("Failed to update password:", updateError.message)
  process.exit(1)
}

console.log("Password updated successfully.")
console.log("  Email:", user.email)
console.log("  User ID:", user.id)
console.log("  Role:", user.app_metadata?.role ?? "(admin)")
console.log("\nTeacher login: /teacher/login")
