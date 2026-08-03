/**
 * Find (and optionally delete) images in storage that no row points at.
 *
 * The app cleans up as it goes — a replaced session photo, a replaced partner
 * photo, and a deleted journal post all remove their files, and a session save
 * that fails after uploading now rolls its uploads back. What is left is
 * history: files from deletions that happened before those handlers existed.
 *
 * Deleting an image is not reversible, so this reports by default and only
 * acts when told to. It also names the owning row for each file, so a wrong
 * rule shows up as "owner still exists" rather than as a missing photo later.
 *
 * Usage:
 *   node scripts/find-orphan-images.mjs                        # report, local
 *   node scripts/find-orphan-images.mjs --apply                # delete, local
 *   node scripts/find-orphan-images.mjs --env .env.prod.local  # report, prod
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in the env file.
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const args = process.argv.slice(2)
const apply = args.includes("--apply")
const envAt = args.indexOf("--env")
const envFile = envAt === -1 ? ".env.local" : args[envAt + 1]
if (!envFile) {
  console.error("--env needs a file path")
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
const supabase = createClient(url, key)

/**
 * Every file in a bucket, at whatever depth.
 *
 * Depth varies by bucket: session and partner photos sit at `{ownerId}/{file}`,
 * but a journal post also keeps `{postId}/inline/{uuid}.png`. Walking a fixed
 * one level counted `inline` itself as a file and never saw the three images
 * under it.
 */
async function listBucket(bucket, prefix = "") {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
  if (error) throw new Error(`${bucket}/${prefix}: ${error.message}`)

  const paths = []
  for (const entry of data ?? []) {
    if (!entry.name || entry.name === ".emptyFolderPlaceholder") continue
    const path = prefix ? `${prefix}/${entry.name}` : entry.name
    // An entry with an id is a file; without one it is a folder to descend into.
    if (entry.id) paths.push(path)
    else paths.push(...(await listBucket(bucket, path)))
  }
  return paths
}

const ownerId = (path) => path.split("/")[0]

const BUCKETS = [
  {
    bucket: "session-photos",
    owner: "session",
    async rules() {
      const { data } = await supabase.from("sessions").select("id, image_paths")
      const referenced = new Set((data ?? []).flatMap((s) => s.image_paths ?? []))
      const owners = new Set((data ?? []).map((s) => s.id))
      return { isReferenced: (p) => referenced.has(p), ownerExists: (p) => owners.has(ownerId(p)) }
    },
  },
  {
    bucket: "person-photos",
    owner: "partner",
    async rules() {
      const { data } = await supabase.from("partners").select("id, photo_path")
      const referenced = new Set((data ?? []).map((p) => p.photo_path).filter(Boolean))
      const owners = new Set((data ?? []).map((p) => p.id))
      return { isReferenced: (p) => referenced.has(p), ownerExists: (p) => owners.has(ownerId(p)) }
    },
  },
  {
    bucket: "journal-photos",
    owner: "journal post",
    async rules() {
      // Hero and inline images both live under `{postId}/`, and deleting a post
      // clears that whole prefix — so belonging to a live post is the rule here,
      // not being named by a column.
      const { data } = await supabase.from("journal_posts").select("id")
      const owners = new Set((data ?? []).map((p) => p.id))
      return { isReferenced: (p) => owners.has(ownerId(p)), ownerExists: (p) => owners.has(ownerId(p)) }
    },
  },
]

console.log(`${apply ? "DELETING" : "Reporting"} orphan images · ${envFile} · ${url}\n`)

let totalOrphans = 0
let kept = 0

for (const { bucket, owner, rules } of BUCKETS) {
  const [paths, { isReferenced, ownerExists }] = await Promise.all([listBucket(bucket), rules()])
  const orphans = paths.filter((p) => !isReferenced(p))

  console.log(`${bucket}: ${paths.length} file(s), ${orphans.length} orphan(s)`)
  for (const path of orphans) {
    const live = ownerExists(path)
    console.log(`  ${path}  — ${owner} ${live ? "still exists (check before deleting)" : "is gone"}`)
    if (live) kept++
  }

  if (orphans.length > 0 && apply) {
    const { error } = await supabase.storage.from(bucket).remove(orphans)
    console.log(error ? `  !! delete failed: ${error.message}` : `  deleted ${orphans.length}`)
  }
  totalOrphans += orphans.length
  console.log("")
}

console.log(`${totalOrphans} orphan(s) total.`)
if (kept > 0) {
  console.log(
    `${kept} of them belong to a row that still exists — worth a look before deleting, since that is also what a wrong rule looks like.`,
  )
}
if (!apply && totalOrphans > 0) console.log("Re-run with --apply to delete.")
