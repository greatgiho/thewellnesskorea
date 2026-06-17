/**
 * Create an admin user in Supabase Auth (one-time setup).
 *
 * Usage:
 *   1. Fill .env.local (see .env.local.example)
 *   2. npm run create-admin -- admin@thewellnesskorea.com YourPassword123
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
const email = process.argv[2] ?? process.env.ADMIN_EMAIL
const password = process.argv[3] ?? process.env.ADMIN_PASSWORD

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  )
  process.exit(1)
}

if (!email || !password) {
  console.error(
    "Usage: npm run create-admin -- your@email.com YourPassword123",
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

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
})

if (error) {
  console.error("Failed to create user:", error.message)
  process.exit(1)
}

console.log("Admin user created successfully.")
console.log("  Email:", email)
console.log("  User ID:", data.user?.id)
console.log("\nLog in at http://localhost:3000/admin/login")
