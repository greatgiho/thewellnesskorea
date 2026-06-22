"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  saveTeacherProfileDraft,
  submitTeacherProfile,
  signOutTeacher,
} from "@/app/apply/actions"
import { ProgramListEditor } from "@/components/admin/program-list-editor"
import type { PartnerFormInput, PartnerWithPrograms } from "@/lib/partners/types"
import type { RegionsForForms } from "@/lib/regions/types"
import {
  ActivityRegionFields,
  teacherActivityRegionLabels,
} from "@/components/partners/activity-region-fields"
import { PartnerPhotoField } from "@/components/partners/partner-photo-field"
import { emptyPersonInput, personInputFromPerson } from "@/lib/partners/form-state"
import {
  uploadPersonPhoto,
  validatePersonPhotoFile,
} from "@/lib/partners/photo-upload"
import {
  REGISTRATION_STATUS_BADGE_CLASS,
  registrationStatusLabel,
} from "@/lib/partners/registration-status"
import { getPartnerPhotoUrl, PERSON_KINDS } from "@/lib/partners/utils"

type TeacherProfileFormProps = {
  person: PartnerWithPrograms | null
  loginEmail: string
  regions: RegionsForForms
}

export function TeacherProfileForm({
  person,
  loginEmail,
  regions,
}: TeacherProfileFormProps) {
  const router = useRouter()
  const [input, setInput] = useState<PartnerFormInput>(
    person
      ? personInputFromPerson(person, { is_published: false })
      : emptyPersonInput({ email: loginEmail }),
  )
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(
    person ? getPartnerPhotoUrl(person.photo_path) : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const status = person?.registration_status ?? "draft"
  const isApproved = status === "approved"

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const validationError = validatePersonPhotoFile(f, {
      invalidType: "JPG, PNG, WebP만 업로드할 수 있습니다.",
      tooLarge: "최대 5MB까지 업로드할 수 있습니다.",
    })
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const persist = async (submit: boolean) => {
    setError(null)
    setPending(true)
    try {
      const personId = person?.id ?? crypto.randomUUID()
      let photoPath: string | null | undefined = undefined
      if (file) {
        photoPath = await uploadPersonPhoto(personId, file)
      } else if (!person) {
        photoPath = null
      }

      const options = {
        newPersonId: person?.id ? undefined : personId,
        photoPath,
      }

      if (submit) {
        await submitTeacherProfile(input, options)
        router.push("/apply/profile/submitted")
      } else {
        await saveTeacherProfileDraft(input, options)
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.")
    } finally {
      setPending(false)
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void persist(true)
      }}
      className="space-y-10"
    >
      <div
        className={`rounded-xl border px-4 py-3 text-sm ${
          REGISTRATION_STATUS_BADGE_CLASS[status]
        }`}
      >
        <p className="font-medium">
          상태: {registrationStatusLabel(status, "ko")}
        </p>
        {status === "rejected" && person?.rejection_reason && (
          <p className="mt-1 text-sm opacity-90">
            반려 사유: {person.rejection_reason}
          </p>
        )}
        {isApproved && (
          <p className="mt-1 text-sm opacity-90">
            승인된 프로필을 수정하면 다시 검토가 필요하며 홈페이지 노출이
            중단됩니다.
          </p>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">유형</h2>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Kind</span>
          <select
            className={fieldClass}
            value={input.kind}
            onChange={(e) =>
              setInput((v) => ({
                ...v,
                kind: e.target.value as PartnerFormInput["kind"],
              }))
            }
          >
            {PERSON_KINDS.filter((k) => k.value !== "brand").map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">기본 정보</h2>
        <PartnerPhotoField
          label="프로필 사진"
          preview={preview}
          onFileChange={onFileChange}
        />
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">이름 (한글)</span>
            <input
              required
              className={fieldClass}
              value={input.name_ko}
              onChange={(e) => setInput((v) => ({ ...v, name_ko: e.target.value }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Name (EN)</span>
            <input
              required
              className={fieldClass}
              value={input.name_en}
              onChange={(e) => setInput((v) => ({ ...v, name_en: e.target.value }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">전화</span>
            <input
              type="tel"
              className={fieldClass}
              value={input.phone}
              onChange={(e) => setInput((v) => ({ ...v, phone: e.target.value }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">이메일</span>
            <input
              type="email"
              required
              className={fieldClass}
              value={input.email}
              onChange={(e) => setInput((v) => ({ ...v, email: e.target.value }))}
            />
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Instagram</span>
            <input
              className={fieldClass}
              placeholder="@handle or full URL"
              value={input.instagram}
              onChange={(e) => setInput((v) => ({ ...v, instagram: e.target.value }))}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <ActivityRegionFields
          regions={regions}
          primaryCode={input.primary_region_code}
          secondaryCode={input.secondary_region_code}
          onPrimaryChange={(code) =>
            setInput((value) => ({ ...value, primary_region_code: code }))
          }
          onSecondaryChange={(code) =>
            setInput((value) => ({ ...value, secondary_region_code: code }))
          }
          labels={teacherActivityRegionLabels}
        />
      </section>

      <section className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">공개 프로필</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">역할 (한글)</span>
            <input
              required
              className={fieldClass}
              value={input.role_ko}
              onChange={(e) => setInput((v) => ({ ...v, role_ko: e.target.value }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Role (EN)</span>
            <input
              required
              className={fieldClass}
              value={input.role_en}
              onChange={(e) => setInput((v) => ({ ...v, role_en: e.target.value }))}
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">한 줄 소개</span>
          <textarea
            rows={3}
            className={fieldClass}
            value={input.quote}
            onChange={(e) => setInput((v) => ({ ...v, quote: e.target.value }))}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">프로그램</h2>
        <p className="text-sm text-muted-foreground">
          수업·프로그램마다 철학 path를 선택해 주세요.
        </p>
        <ProgramListEditor
          programs={input.programs}
          onChange={(programs) => setInput((v) => ({ ...v, programs }))}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => void persist(false)}
          className="inline-flex h-10 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted disabled:opacity-50"
        >
          {pending ? "저장 중…" : "임시 저장"}
        </button>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "제출 중…" : isApproved ? "수정 후 재제출" : "제출하기"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => void signOutTeacher()}
          className="inline-flex h-10 items-center rounded-lg px-4 text-sm text-muted-foreground hover:text-foreground"
        >
          로그아웃
        </button>
      </div>
    </form>
  )
}
