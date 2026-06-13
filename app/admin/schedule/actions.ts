"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  extFromPath,
  SESSION_PHOTOS_BUCKET,
  sessionPhotoStoragePath,
} from "@/lib/schedule/images"
import type { SessionDescriptionBlocks, SessionFormInput } from "@/lib/schedule/types"
import {
  formatTimeInKst,
  isWithinOperatingHours,
  kstDayRange,
  sessionsOverlap,
  toKstIso,
} from "@/lib/schedule/utils"

async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  return supabase
}

function validateSessionInput(input: SessionFormInput): {
  starts_at: string
  ends_at: string
} {
  if (!input.title.trim()) throw new Error("Session title is required.")
  if (input.capacity <= 0) throw new Error("Capacity must be greater than 0.")
  if (input.path_keys.length === 0) {
    throw new Error("Select at least one philosophy path.")
  }
  if (input.image_paths.length > 3) {
    throw new Error("Maximum 3 images per session.")
  }
  if (!isWithinOperatingHours(input.date, input.start_time, input.end_time)) {
    throw new Error("Session must be within operating hours (06:00–24:00).")
  }

  const starts_at = toKstIso(input.date, input.start_time)
  const ends_at = toKstIso(input.date, input.end_time)

  if (new Date(ends_at) <= new Date(starts_at)) {
    throw new Error("End time must be after start time.")
  }

  return { starts_at, ends_at }
}

async function assertNoConflicts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
  excludeId?: string,
) {
  const { start, end } = kstDayRange(input.date)

  const { data: daySessions, error } = await supabase
    .from("sessions")
    .select("id, floor_id, instructor_id, starts_at, ends_at, title")
    .gte("starts_at", start)
    .lt("starts_at", end)

  if (error) throw new Error(error.message)

  for (const s of daySessions ?? []) {
    if (excludeId && s.id === excludeId) continue
    if (!sessionsOverlap(starts_at, ends_at, s.starts_at, s.ends_at)) continue

    const range = `${formatTimeInKst(s.starts_at)}–${formatTimeInKst(s.ends_at)}`

    if (s.floor_id === input.floor_id) {
      throw new Error(`Floor conflict: "${s.title}" overlaps (${range}).`)
    }
    if (s.instructor_id === input.instructor_id) {
      throw new Error(`Instructor conflict: "${s.title}" overlaps (${range}).`)
    }
  }
}

function trimDescriptionBlocks(
  blocks: SessionDescriptionBlocks,
): SessionDescriptionBlocks {
  return {
    intro: blocks.intro.trim(),
    progress: blocks.progress.trim(),
    preparation: blocks.preparation.trim(),
  }
}

function sessionRowFromInput(
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
) {
  return {
    floor_id: input.floor_id,
    instructor_id: input.instructor_id,
    person_program_id: input.person_program_id || null,
    title: input.title.trim(),
    path_keys: input.path_keys,
    starts_at,
    ends_at,
    capacity: input.capacity,
    is_published: input.is_published,
    image_paths: input.image_paths,
    description_blocks: trimDescriptionBlocks(input.description_blocks),
  }
}

async function removeSessionPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: string[],
) {
  if (paths.length === 0) return
  await supabase.storage.from(SESSION_PHOTOS_BUCKET).remove(paths)
}

async function copySessionPhotos(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourcePaths: string[],
  targetSessionId: string,
): Promise<string[]> {
  const copied: string[] = []

  for (let i = 0; i < sourcePaths.length; i++) {
    const src = sourcePaths[i]
    const ext = extFromPath(src)
    const dest = sessionPhotoStoragePath(targetSessionId, i, ext)

    const { data, error } = await supabase.storage
      .from(SESSION_PHOTOS_BUCKET)
      .download(src)

    if (error || !data) continue

    const { error: uploadError } = await supabase.storage
      .from(SESSION_PHOTOS_BUCKET)
      .upload(dest, data, { upsert: true, contentType: data.type || undefined })

    if (!uploadError) copied.push(dest)
  }

  return copied
}

export async function saveSession(
  input: SessionFormInput,
  sessionId?: string,
): Promise<string> {
  const supabase = await requireAuth()
  const { starts_at, ends_at } = validateSessionInput(input)
  await assertNoConflicts(supabase, input, starts_at, ends_at, sessionId)

  const row = sessionRowFromInput(input, starts_at, ends_at)

  if (sessionId) {
    const { data: existing, error: fetchError } = await supabase
      .from("sessions")
      .select("image_paths")
      .eq("id", sessionId)
      .maybeSingle()

    if (fetchError) throw new Error(fetchError.message)

    const oldPaths = (existing?.image_paths as string[] | undefined) ?? []
    const removed = oldPaths.filter((p) => !input.image_paths.includes(p))
    if (removed.length > 0) await removeSessionPhotos(supabase, removed)

    const { error } = await supabase
      .from("sessions")
      .update(row)
      .eq("id", sessionId)
    if (error) throw new Error(error.message)

    revalidatePath("/admin/schedule")
    revalidatePath("/")
    return sessionId
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert(row)
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidatePath("/admin/schedule")
  revalidatePath("/")
  return data.id
}

export type DuplicateSessionInput = {
  date: string
  start_time: string
  end_time: string
  floor_id: string
  is_published?: boolean
}

export async function duplicateSession(
  sourceSessionId: string,
  target: DuplicateSessionInput,
): Promise<string> {
  const supabase = await requireAuth()

  const { data: source, error: fetchError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sourceSessionId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!source) throw new Error("Source session not found.")

  const input: SessionFormInput = {
    floor_id: target.floor_id,
    instructor_id: source.instructor_id,
    person_program_id: source.person_program_id,
    title: source.title,
    path_keys: source.path_keys ?? [],
    date: target.date,
    start_time: target.start_time,
    end_time: target.end_time,
    capacity: source.capacity,
    is_published: target.is_published ?? false,
    image_paths: [],
    description_blocks: source.description_blocks as SessionDescriptionBlocks,
  }

  const { starts_at, ends_at } = validateSessionInput(input)
  await assertNoConflicts(supabase, input, starts_at, ends_at)

  const row = sessionRowFromInput(input, starts_at, ends_at)
  row.image_paths = []
  row.is_published = target.is_published ?? false

  const { data: inserted, error: insertError } = await supabase
    .from("sessions")
    .insert(row)
    .select("id")
    .single()

  if (insertError) throw new Error(insertError.message)

  const sourcePaths = (source.image_paths as string[] | undefined) ?? []
  if (sourcePaths.length > 0) {
    const copiedPaths = await copySessionPhotos(
      supabase,
      sourcePaths,
      inserted.id,
    )
    if (copiedPaths.length > 0) {
      const { error: updateError } = await supabase
        .from("sessions")
        .update({ image_paths: copiedPaths })
        .eq("id", inserted.id)
      if (updateError) throw new Error(updateError.message)
    }
  }

  revalidatePath("/admin/schedule")
  revalidatePath("/")
  return inserted.id
}

export async function deleteSession(sessionId: string) {
  const supabase = await requireAuth()

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("image_paths")
    .eq("id", sessionId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)

  const paths = (session?.image_paths as string[] | undefined) ?? []
  if (paths.length > 0) await removeSessionPhotos(supabase, paths)

  const { error } = await supabase.from("sessions").delete().eq("id", sessionId)
  if (error) throw new Error(error.message)

  revalidatePath("/admin/schedule")
  revalidatePath("/")
}
