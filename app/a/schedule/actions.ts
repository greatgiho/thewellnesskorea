"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdminSession } from "@/lib/auth/require-session"
import { UserFacingError, isUserFacingError } from "@/lib/errors"
import type {
  SessionDescriptionBlocks,
  SessionFormInput,
} from "@/lib/schedule/types"
import { formatTimeInKst } from "@/lib/schedule/utils"
import { validateSessionInput } from "@/lib/schedule/session-validate"
import { sessionRowFromInput } from "@/lib/schedule/session-row"
import {
  copySessionPhotos,
  removeSessionPhotos,
} from "@/lib/schedule/session-photos"
import {
  cancelCompetingProcessing,
  resolveExperienceIdForFloor,
  resolveSessionSlot,
} from "@/lib/schedule/session-slots"

async function requireAuth() {
  const { supabase, userId, userEmail } = await requireAdminSession()
  return { supabase, userId, userEmail }
}

/**
 * The database enforces these too. Checking here as well turns a constraint
 * violation into a message the admin can act on, and keeps the two columns
 * from being saved half-set.
 */
function revalidateSessionCaches(isPublished: boolean) {
  revalidatePath("/a/schedule")
  if (isPublished) revalidatePath("/")
}

export type SessionSaveResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string }

async function saveSessionCore(
  input: SessionFormInput,
  sessionId?: string,
  newSessionId?: string,
): Promise<string> {
  const { supabase, userId, userEmail } = await requireAuth()
  const { starts_at, ends_at } = validateSessionInput(input)
  const experience_id = await resolveExperienceIdForFloor(supabase, input.floor_id)
  const { slot_lane } = await resolveSessionSlot(
    supabase,
    input,
    experience_id,
    starts_at,
    ends_at,
    sessionId,
  )

  const row = sessionRowFromInput(input, starts_at, ends_at, slot_lane, experience_id)

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

export async function saveSession(
  input: SessionFormInput,
  sessionId?: string,
  newSessionId?: string,
): Promise<SessionSaveResult> {
  try {
    const id = await saveSessionCore(input, sessionId, newSessionId)
    return { ok: true, sessionId: id }
  } catch (err) {
    if (isUserFacingError(err)) return { ok: false, error: err.message }
    console.error("[saveSession]", err)
    return { ok: false, error: "Failed to save session. Please try again." }
  }
}

export type ConfirmSessionResult =
  | { ok: true; sessionId: string; cancelledCount: number }
  | { ok: false; error: string }

async function confirmSessionCore(
  sessionId: string,
): Promise<{ sessionId: string; cancelledCount: number }> {
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
    is_all_floors: session.is_all_floors,
    instructor_id: session.instructor_id,
    partner_program_id: session.partner_program_id,
    title: session.title,
    blurb_en: session.blurb_en ?? "",
    blurb_ko: session.blurb_ko ?? "",
    path_keys: session.path_keys ?? [],
    date: session.starts_at.slice(0, 10),
    start_time: formatTimeInKst(session.starts_at),
    end_time: formatTimeInKst(session.ends_at),
    capacity: session.capacity,
    price_currency: session.price_currency ?? "USD",
    price_amount: session.price_amount ?? 0,
    child_price_amount: session.child_price_amount ?? null,
    payment_method: session.payment_method === "onsite" ? "onsite" : "online",
    tiers: [],
    discount_type: session.discount_type ?? null,
    discount_value: session.discount_value ?? null,
    is_published: session.is_published,
    is_listed: session.is_listed ?? true,
    status: "confirmed",
    image_paths: session.image_paths ?? [],
    description_blocks: session.description_blocks as SessionDescriptionBlocks,
  }

  const { starts_at, ends_at } = validateSessionInput(input)
  await resolveSessionSlot(
    supabase,
    input,
    session.experience_id,
    starts_at,
    ends_at,
    sessionId,
  )

  const now = new Date().toISOString()
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      status: "confirmed",
      slot_lane: 0,
      confirmed_at: now,
      confirmed_by: userId,
      is_published: true,
    })
    .eq("id", sessionId)

  if (updateError) throw new Error(updateError.message)

  const cancelledCount = await cancelCompetingProcessing(
    supabase,
    sessionId,
    {
      isAllFloors: session.is_all_floors,
      floorId: session.floor_id,
      experienceId: session.experience_id,
    },
    session.starts_at,
    session.ends_at,
    userId,
  )

  revalidateSessionCaches(true)
  return { sessionId, cancelledCount }
}

export async function confirmSession(sessionId: string): Promise<ConfirmSessionResult> {
  try {
    const result = await confirmSessionCore(sessionId)
    return { ok: true, ...result }
  } catch (err) {
    if (isUserFacingError(err)) return { ok: false, error: err.message }
    console.error("[confirmSession]", err)
    return { ok: false, error: "Failed to confirm session. Please try again." }
  }
}

export type UnconfirmSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string }

async function unconfirmSessionCore(
  sessionId: string,
): Promise<{ sessionId: string }> {
  const { supabase } = await requireAuth()

  const { data: session, error: fetchError } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle()

  if (fetchError) throw new Error(fetchError.message)
  if (!session) throw new Error("Session not found.")
  if (session.status === "cancelled") {
    throw new Error("Cancelled sessions cannot be reverted.")
  }
  if (session.status === "processing") {
    return { sessionId }
  }

  const input: SessionFormInput = {
    is_listed: session.is_listed ?? true,
    floor_id: session.floor_id,
    is_all_floors: session.is_all_floors,
    instructor_id: session.instructor_id,
    partner_program_id: session.partner_program_id,
    title: session.title,
    blurb_en: session.blurb_en ?? "",
    blurb_ko: session.blurb_ko ?? "",
    path_keys: session.path_keys ?? [],
    date: session.starts_at.slice(0, 10),
    start_time: formatTimeInKst(session.starts_at),
    end_time: formatTimeInKst(session.ends_at),
    capacity: session.capacity,
    price_currency: session.price_currency ?? "USD",
    price_amount: session.price_amount ?? 0,
    child_price_amount: session.child_price_amount ?? null,
    payment_method: session.payment_method === "onsite" ? "onsite" : "online",
    tiers: [],
    discount_type: session.discount_type ?? null,
    discount_value: session.discount_value ?? null,
    is_published: false,
    status: "processing",
    image_paths: session.image_paths ?? [],
    description_blocks: session.description_blocks as SessionDescriptionBlocks,
  }

  const { starts_at, ends_at } = validateSessionInput(input)
  const { slot_lane } = await resolveSessionSlot(
    supabase,
    input,
    session.experience_id,
    starts_at,
    ends_at,
    sessionId,
  )

  const wasPublished = session.is_published
  const { error: updateError } = await supabase
    .from("sessions")
    .update({
      status: "processing",
      slot_lane,
      is_published: false,
      confirmed_at: null,
      confirmed_by: null,
    })
    .eq("id", sessionId)

  if (updateError) throw new Error(updateError.message)

  revalidateSessionCaches(wasPublished)
  return { sessionId }
}

export async function unconfirmSession(sessionId: string): Promise<UnconfirmSessionResult> {
  try {
    const result = await unconfirmSessionCore(sessionId)
    return { ok: true, ...result }
  } catch (err) {
    if (isUserFacingError(err)) return { ok: false, error: err.message }
    console.error("[unconfirmSession]", err)
    return { ok: false, error: "Failed to revert session. Please try again." }
  }
}

export type DuplicateSessionInput = {
  date: string
  start_time: string
  end_time: string
  floor_id: string
}

export type DuplicateSessionResult =
  | { ok: true; sessionId: string }
  | { ok: false; error: string }

async function duplicateSessionCore(
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
    // A copy of an unlisted class is unlisted too — duplicating a private
    // session onto the public homepage is not what "duplicate" means.
    is_listed: source.is_listed ?? true,
    floor_id: target.floor_id,
    is_all_floors: source.is_all_floors,
    instructor_id: source.instructor_id,
    partner_program_id: source.partner_program_id,
    title: source.title,
    blurb_en: source.blurb_en ?? "",
    blurb_ko: source.blurb_ko ?? "",
    path_keys: source.path_keys ?? [],
    date: target.date,
    start_time: target.start_time,
    end_time: target.end_time,
    capacity: source.capacity,
    price_currency: source.price_currency ?? "USD",
    price_amount: source.price_amount ?? 0,
    child_price_amount: source.child_price_amount ?? null,
    payment_method: source.payment_method === "onsite" ? "onsite" : "online",
    tiers: [],
    discount_type: source.discount_type ?? null,
    discount_value: source.discount_value ?? null,
    is_published: false,
    status: "processing",
    image_paths: [],
    description_blocks: source.description_blocks as SessionDescriptionBlocks,
  }

  const { starts_at, ends_at } = validateSessionInput(input)
  const experience_id = await resolveExperienceIdForFloor(supabase, input.floor_id)
  const { slot_lane } = await resolveSessionSlot(
    supabase,
    input,
    experience_id,
    starts_at,
    ends_at,
  )

  const row = sessionRowFromInput(input, starts_at, ends_at, slot_lane, experience_id)
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

export async function duplicateSession(
  sourceSessionId: string,
  target: DuplicateSessionInput,
): Promise<DuplicateSessionResult> {
  try {
    const id = await duplicateSessionCore(sourceSessionId, target)
    return { ok: true, sessionId: id }
  } catch (err) {
    if (isUserFacingError(err)) return { ok: false, error: err.message }
    console.error("[duplicateSession]", err)
    return { ok: false, error: "Failed to duplicate session. Please try again." }
  }
}

export type DeleteSessionResult =
  | { ok: true }
  | { ok: false; error: string }

async function deleteSessionCore(sessionId: string): Promise<void> {
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

export async function deleteSession(sessionId: string): Promise<DeleteSessionResult> {
  try {
    await deleteSessionCore(sessionId)
    return { ok: true }
  } catch (err) {
    if (isUserFacingError(err)) return { ok: false, error: err.message }
    console.error("[deleteSession]", err)
    return { ok: false, error: "Failed to delete session. Please try again." }
  }
}
