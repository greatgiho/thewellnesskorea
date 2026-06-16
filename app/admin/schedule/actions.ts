"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import {
  extFromPath,
  SESSION_PHOTOS_BUCKET,
  sessionPhotoStoragePath,
} from "@/lib/schedule/images"
import type {
  SessionDescriptionBlocks,
  SessionFormInput,
  SessionStatus,
} from "@/lib/schedule/types"
import {
  formatTimeInKst,
  isWithinOperatingHours,
  kstDayRange,
  sessionsOverlap,
  toKstIso,
} from "@/lib/schedule/utils"

type AuthContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
  userEmail: string | undefined
}

type SessionConflictRow = {
  id: string
  floor_id: string
  instructor_id: string
  starts_at: string
  ends_at: string
  title: string
  status: SessionStatus
  slot_lane: number
}

async function requireAuth(): Promise<AuthContext> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/admin/login")
  return { supabase, userId: user.id, userEmail: user.email }
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
  if (input.status === "processing" && input.is_published) {
    throw new Error("Only confirmed sessions can be published.")
  }

  const starts_at = toKstIso(input.date, input.start_time)
  const ends_at = toKstIso(input.date, input.end_time)

  if (new Date(ends_at) <= new Date(starts_at)) {
    throw new Error("End time must be after start time.")
  }

  return { starts_at, ends_at }
}

function revalidateSessionCaches(isPublished: boolean) {
  revalidatePath("/admin/schedule")
  if (isPublished) revalidatePath("/")
}

async function fetchOverlappingSessions(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
  excludeId?: string,
): Promise<SessionConflictRow[]> {
  const { start, end } = kstDayRange(input.date)

  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id, floor_id, instructor_id, starts_at, ends_at, title, status, slot_lane",
    )
    .gte("starts_at", start)
    .lt("starts_at", end)
    .neq("status", "cancelled")
    .or(
      `floor_id.eq.${input.floor_id},instructor_id.eq.${input.instructor_id}`,
    )

  if (error) throw new Error(error.message)

  return (data ?? []).filter((row) => {
    if (excludeId && row.id === excludeId) return false
    return sessionsOverlap(starts_at, ends_at, row.starts_at, row.ends_at)
  }) as SessionConflictRow[]
}

function assignProcessingLane(processingInBucket: SessionConflictRow[]): number {
  const used = new Set(processingInBucket.map((s) => s.slot_lane))
  if (!used.has(0)) return 0
  if (!used.has(1)) return 1
  throw new Error("Maximum 2 competing sessions in this slot.")
}

function assertConfirmedOverlap(
  overlapping: SessionConflictRow[],
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
) {
  for (const s of overlapping) {
    if (s.status !== "confirmed") continue
    const range = `${formatTimeInKst(s.starts_at)}–${formatTimeInKst(s.ends_at)}`
    if (s.floor_id === input.floor_id) {
      throw new Error(`Floor conflict: "${s.title}" overlaps (${range}).`)
    }
    if (s.instructor_id === input.instructor_id) {
      throw new Error(`Instructor conflict: "${s.title}" overlaps (${range}).`)
    }
  }
}

async function resolveSessionSlot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: SessionFormInput,
  starts_at: string,
  ends_at: string,
  excludeId?: string,
): Promise<{ slot_lane: number }> {
  const overlapping = await fetchOverlappingSessions(
    supabase,
    input,
    starts_at,
    ends_at,
    excludeId,
  )
  const bucketOverlaps = overlapping.filter((s) => s.floor_id === input.floor_id)
  const hasConfirmedInBucket = bucketOverlaps.some(
    (s) => s.status === "confirmed",
  )

  if (input.status === "processing") {
    if (hasConfirmedInBucket) {
      throw new Error(
        "This slot is already confirmed. Add a processing session elsewhere.",
      )
    }
    const processingInBucket = bucketOverlaps.filter(
      (s) => s.status === "processing",
    )
    if (processingInBucket.length >= 2) {
      throw new Error("Maximum 2 competing sessions in this slot.")
    }
    assertConfirmedOverlap(overlapping, input, starts_at, ends_at)
    return { slot_lane: assignProcessingLane(processingInBucket) }
  }

  if (hasConfirmedInBucket) {
    throw new Error("This slot already has a confirmed session.")
  }
  const otherProcessing = bucketOverlaps.filter(
    (s) => s.status === "processing",
  )
  if (otherProcessing.length > 0) {
    throw new Error(
      "Resolve competing processing sessions with Confirm, or cancel them first.",
    )
  }
  assertConfirmedOverlap(overlapping, input, starts_at, ends_at)
  return { slot_lane: 0 }
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
  slot_lane: number,
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
    is_published: input.status === "confirmed" ? input.is_published : false,
    status: input.status,
    slot_lane,
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

async function cancelCompetingProcessing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  winnerId: string,
  floorId: string,
  starts_at: string,
  ends_at: string,
  cancelledBy: string,
): Promise<number> {
  const date = starts_at.slice(0, 10)
  const { start, end } = kstDayRange(date)

  const { data, error } = await supabase
    .from("sessions")
    .select("id, starts_at, ends_at")
    .eq("floor_id", floorId)
    .eq("status", "processing")
    .neq("id", winnerId)
    .gte("starts_at", start)
    .lt("starts_at", end)

  if (error) throw new Error(error.message)

  const losers = (data ?? []).filter((s) =>
    sessionsOverlap(starts_at, ends_at, s.starts_at, s.ends_at),
  )
  if (losers.length === 0) return 0

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      status: "cancelled",
      cancelled_at: now,
      cancelled_by: cancelledBy,
      cancel_reason: "competition_lost",
    })
    .in(
      "id",
      losers.map((s) => s.id),
    )

  if (updateError) throw new Error(updateError.message)

  // TODO: notify each cancelled session's created_by

  return losers.length
}

export async function saveSession(
  input: SessionFormInput,
  sessionId?: string,
  newSessionId?: string,
): Promise<string> {
  const { supabase, userId, userEmail } = await requireAuth()
  const { starts_at, ends_at } = validateSessionInput(input)
  const { slot_lane } = await resolveSessionSlot(
    supabase,
    input,
    starts_at,
    ends_at,
    sessionId,
  )

  const row = sessionRowFromInput(input, starts_at, ends_at, slot_lane)

  if (sessionId) {
    const { data: existing, error: fetchError } = await supabase
      .from("sessions")
      .select("image_paths, status")
      .eq("id", sessionId)
      .maybeSingle()

    if (fetchError) throw new Error(fetchError.message)
    if (existing?.status === "cancelled") {
      throw new Error("Cancelled sessions cannot be edited.")
    }
    if (existing?.status === "confirmed" && input.status === "processing") {
      throw new Error("Confirmed sessions cannot revert to processing.")
    }

    const oldPaths = (existing?.image_paths as string[] | undefined) ?? []
    const removed = oldPaths.filter((p) => !input.image_paths.includes(p))
    if (removed.length > 0) await removeSessionPhotos(supabase, removed)

    const { error } = await supabase
      .from("sessions")
      .update(row)
      .eq("id", sessionId)
    if (error) throw new Error(error.message)

    revalidateSessionCaches(row.is_published)
    return sessionId
  }

  const insertRow = {
    ...(newSessionId ? { id: newSessionId } : {}),
    ...row,
    created_by: userId,
    created_by_email: userEmail ?? null,
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert(insertRow)
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  revalidateSessionCaches(row.is_published)
  return data.id
}

export type ConfirmSessionResult = {
  sessionId: string
  cancelledCount: number
}

export async function confirmSession(
  sessionId: string,
): Promise<ConfirmSessionResult> {
  const { supabase, userId } = await requireAuth()

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!session) throw new Error("Session not found.")
  if (session.status === "cancelled") {
    throw new Error("Cancelled sessions cannot be confirmed.")
  }
  if (session.status === "confirmed") {
    return { sessionId, cancelledCount: 0 }
  }

  const input: SessionFormInput = {
    floor_id: session.floor_id,
    instructor_id: session.instructor_id,
    person_program_id: session.person_program_id,
    title: session.title,
    path_keys: session.path_keys ?? [],
    date: session.starts_at.slice(0, 10),
    start_time: formatTimeInKst(session.starts_at),
    end_time: formatTimeInKst(session.ends_at),
    capacity: session.capacity,
    is_published: session.is_published,
    status: "confirmed",
    image_paths: session.image_paths ?? [],
    description_blocks: session.description_blocks as SessionDescriptionBlocks,
  }

  const { starts_at, ends_at } = validateSessionInput(input)
  await resolveSessionSlot(supabase, input, starts_at, ends_at, sessionId)

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      status: "confirmed",
      slot_lane: 0,
      confirmed_at: now,
      confirmed_by: userId,
    })
    .eq("id", sessionId)

  if (updateError) throw new Error(updateError.message)

  const cancelledCount = await cancelCompetingProcessing(
    supabase,
    sessionId,
    session.floor_id,
    session.starts_at,
    session.ends_at,
    userId,
  )

  revalidateSessionCaches(session.is_published)
  return { sessionId, cancelledCount }
}

export type DuplicateSessionInput = {
  date: string
  start_time: string
  end_time: string
  floor_id: string
}

export async function duplicateSession(
  sourceSessionId: string,
  target: DuplicateSessionInput,
): Promise<string> {
  const { supabase, userId, userEmail } = await requireAuth()

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
    is_published: false,
    status: "processing",
    image_paths: [],
    description_blocks: source.description_blocks as SessionDescriptionBlocks,
  }

  const { starts_at, ends_at } = validateSessionInput(input)
  const { slot_lane } = await resolveSessionSlot(
    supabase,
    input,
    starts_at,
    ends_at,
  )

  const row = sessionRowFromInput(input, starts_at, ends_at, slot_lane)
  row.image_paths = []

  const { data: inserted, error: insertError } = await supabase
    .from("sessions")
    .insert({
      ...row,
      created_by: userId,
      created_by_email: userEmail ?? null,
    })
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

  revalidateSessionCaches(false)
  return inserted.id
}

export async function deleteSession(sessionId: string) {
  const supabase = await requireAuth().then((ctx) => ctx.supabase)

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("image_paths, is_published")
    .eq("id", sessionId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)

  const paths = (session?.image_paths as string[] | undefined) ?? []
  if (paths.length > 0) await removeSessionPhotos(supabase, paths)

  const { error } = await supabase.from("sessions").delete().eq("id", sessionId)
  if (error) throw new Error(error.message)

  revalidateSessionCaches(session?.is_published ?? false)
}
