import type { SupabaseClient } from "@supabase/supabase-js"
import { assertTeacherEmailAvailable } from "@/lib/auth/teacher-email"
import { maybeProvisionOnAdminSave } from "@/lib/auth/teacher-account"
import {
  assertPartnerEmailUnique,
  throwPartnerPersistError,
} from "@/lib/partners/email-uniqueness"
import { notifyAdminProfileSubmitted } from "@/lib/notifications/admin-alerts"
import {
  personRowFromInput,
  resolvePersonSlug,
  savePartnerPrograms,
} from "@/lib/partners/persist"
import { canPublishPerson } from "@/lib/partners/registration-status"
import type {
  PartnerFormInput,
  PartnerRegistrationStatus,
  PartnerRow,
} from "@/lib/partners/types"
import { validatePersonInput } from "@/lib/partners/validate"
import { getRegionsForForms } from "@/lib/regions/queries"
import { savePartnerActivityRegions } from "@/lib/regions/persist"

export type PersistPersonPhotoOptions = {
  newPersonId?: string
  photoPath?: string | null
}

export type AdminPersistContext = {
  mode: "admin"
  personId?: string
  options?: PersistPersonPhotoOptions
}

export type TeacherPersistContext = {
  mode: "teacher"
  person: PartnerRow | null
  userId: string
  submit: boolean
  options?: PersistPersonPhotoOptions
}

export type PersistPersonContext = AdminPersistContext | TeacherPersistContext

export type PersistPersonResult = {
  personId: string
  slug: string
  isPublished: boolean
  notify: boolean
}

function resolveTeacherNextStatus(
  previousStatus: PartnerRegistrationStatus,
  submit: boolean,
): { status: PartnerRegistrationStatus; notify: boolean } {
  if (previousStatus === "approved") {
    return { status: "submitted", notify: true }
  }
  if (submit) {
    return { status: "submitted", notify: true }
  }
  if (previousStatus === "submitted") {
    return { status: "submitted", notify: false }
  }
  return { status: "draft", notify: false }
}

export async function persistPartner(
  supabase: SupabaseClient,
  input: PartnerFormInput,
  ctx: PersistPersonContext,
): Promise<PersistPersonResult> {
  const regions = await getRegionsForForms()
  validatePersonInput(input, regions)

  if (ctx.mode === "admin") {
    return persistAdminPerson(supabase, input, ctx)
  }
  return persistTeacherPerson(supabase, input, ctx)
}

async function persistAdminPerson(
  supabase: SupabaseClient,
  input: PartnerFormInput,
  ctx: AdminPersistContext,
): Promise<PersistPersonResult> {
  let personId = ctx.personId
  const options = ctx.options

  const slug = await resolvePersonSlug(supabase, input, personId)

  let sortOrder = 0
  let existingPhotoPath: string | null = null
  let registrationStatus: PartnerRegistrationStatus = "admin"
  let existingEmail: string | null = null
  let existingUserId: string | null = null

  if (personId) {
    const { data: existing } = await supabase
      .from("partners")
      .select(
        "sort_order, photo_path, registration_status, is_published, email, user_id",
      )
      .eq("id", personId)
      .maybeSingle()

    sortOrder = existing?.sort_order ?? 0
    existingPhotoPath = existing?.photo_path ?? null
    registrationStatus = (existing?.registration_status ??
      "admin") as PartnerRegistrationStatus
    existingEmail = existing?.email ?? null
    existingUserId = existing?.user_id ?? null

    if (input.is_published && !canPublishPerson(registrationStatus)) {
      throw new Error("Profile must be approved before publishing.")
    }
  }

  const row = personRowFromInput(input, slug, sortOrder) as ReturnType<
    typeof personRowFromInput
  > & { photo_path?: string | null; registration_status?: string }

  if (!personId) {
    row.registration_status = "admin"
  }

  if (options?.photoPath !== undefined) {
    row.photo_path = options.photoPath
  } else if (!personId) {
    row.photo_path = null
  }

  if (
    personId &&
    options?.photoPath &&
    existingPhotoPath &&
    existingPhotoPath !== options.photoPath
  ) {
    await supabase.storage.from("person-photos").remove([existingPhotoPath])
  }

  await assertPartnerEmailUnique(input.email, personId)
  await assertTeacherEmailAvailable(input.email, {
    excludeUserId: existingUserId,
  })

  personId = await upsertPeopleRow(supabase, personId, row, options?.newPersonId)
  await savePartnerPrograms(supabase, personId, input)
  await savePartnerActivityRegions(
    supabase,
    personId,
    input.primary_region_code,
    input.secondary_region_code,
  )

  await maybeProvisionOnAdminSave(supabase, personId, {
    email: input.email,
    previousEmail: existingEmail,
    previousUserId: existingUserId,
    registrationStatus,
  })

  return {
    personId,
    slug,
    isPublished: input.is_published,
    notify: false,
  }
}

async function persistTeacherPerson(
  supabase: SupabaseClient,
  input: PartnerFormInput,
  ctx: TeacherPersistContext,
): Promise<PersistPersonResult> {
  const person = ctx.person
  const options = ctx.options
  const previousStatus = (person?.registration_status ??
    "draft") as PartnerRegistrationStatus
  const { status: nextStatus, notify } = resolveTeacherNextStatus(
    previousStatus,
    ctx.submit,
  )

  const slug = await resolvePersonSlug(supabase, input, person?.id)
  const now = new Date().toISOString()
  const row: Record<string, unknown> = {
    ...personRowFromInput({ ...input, is_published: false }, slug, person?.sort_order ?? 0),
    user_id: ctx.userId,
    registration_status: nextStatus,
    is_published: false,
  }

  if (nextStatus === "submitted" && notify) {
    row.submitted_at = now
    row.reviewed_at = null
    row.reviewed_by = null
    row.rejection_reason = null
  } else if (nextStatus === "submitted") {
    row.submitted_at = person?.submitted_at ?? now
  }

  if (options?.photoPath !== undefined) {
    row.photo_path = options.photoPath
  }

  await assertPartnerEmailUnique(input.email, person?.id)

  const personId = await upsertPeopleRow(
    supabase,
    person?.id,
    row,
    options?.newPersonId,
  )

  await savePartnerPrograms(supabase, personId, input)
  await savePartnerActivityRegions(
    supabase,
    personId,
    input.primary_region_code,
    input.secondary_region_code,
  )

  if (notify) {
    await notifyAdminProfileSubmitted({
      personId,
      nameKo: input.name_ko,
      nameEn: input.name_en,
      email: input.email,
      kind: input.kind,
      previousStatus,
    })
  }

  return {
    personId,
    slug,
    isPublished: false,
    notify,
  }
}

async function upsertPeopleRow(
  supabase: SupabaseClient,
  personId: string | undefined,
  row: Record<string, unknown>,
  newPersonId?: string,
): Promise<string> {
  if (personId) {
    const { error } = await supabase.from("partners").update(row).eq("id", personId)
    if (error) throwPartnerPersistError(error)
    return personId
  }

  const insertRow = newPersonId ? { id: newPersonId, ...row } : row
  const { data, error } = await supabase
    .from("partners")
    .insert(insertRow)
    .select("id")
    .single()

  if (error) throwPartnerPersistError(error)
  return data.id as string
}
