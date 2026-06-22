"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { PartnerFormInput, PartnerWithPrograms } from "@/lib/partners/types"
import type { RegionsForForms } from "@/lib/regions/types"
import { ActivityRegionFields } from "@/components/partners/activity-region-fields"
import { PartnerPhotoField } from "@/components/partners/partner-photo-field"
import { savePartner } from "@/app/admin/actions"
import { emptyPersonInput, personInputFromPerson } from "@/lib/partners/form-state"
import {
  uploadPersonPhoto,
  validatePersonPhotoFile,
} from "@/lib/partners/photo-upload"
import { canPublishPerson } from "@/lib/partners/registration-status"
import { getPartnerPhotoUrl, PERSON_KINDS } from "@/lib/partners/utils"
import { ProgramListEditor } from "@/components/admin/program-list-editor"

type PartnerFormProps = {
  person?: PartnerWithPrograms
  regions: RegionsForForms
}

export function PartnerForm({ person, regions }: PartnerFormProps) {
  const router = useRouter()
  const isEdit = Boolean(person)
  const [input, setInput] = useState<PartnerFormInput>(
    person ? personInputFromPerson(person) : emptyPersonInput(),
  )
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(
    person ? getPartnerPhotoUrl(person.photo_path) : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const publishAllowed = person
    ? canPublishPerson(person.registration_status)
    : true

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const validationError = validatePersonPhotoFile(f, {
      invalidType: "Use JPG, PNG, or WebP.",
      tooLarge: "Max file size is 5MB.",
    })
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const result = await savePartner(input, person?.id, {
        newPersonId: person?.id ? undefined : personId,
        photoPath,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push("/admin/partners")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-2xl space-y-10">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Partner type</h2>
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
            {PERSON_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Basic info</h2>
        <p className="text-sm text-muted-foreground">
          Contact details are admin-only and never shown on the public site.
        </p>

        <PartnerPhotoField
          label="Profile photo"
          preview={preview}
          onFileChange={onFileChange}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Name (KO)</span>
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
            <span className="text-sm font-medium">Phone</span>
            <input
              type="tel"
              className={fieldClass}
              value={input.phone}
              onChange={(e) => setInput((v) => ({ ...v, phone: e.target.value }))}
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Email</span>
            <input
              type="email"
              className={fieldClass}
              value={input.email}
              onChange={(e) => setInput((v) => ({ ...v, email: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Teacher login and contact. Cannot be the same as an admin account
              email.
            </p>
          </label>
          <label className="block space-y-2 sm:col-span-2">
            <span className="text-sm font-medium">Instagram</span>
            <input
              className={fieldClass}
              placeholder="@handle or full URL"
              value={input.instagram}
              onChange={(e) => setInput((v) => ({ ...v, instagram: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Shown as a link on the public profile card.
            </p>
          </label>
        </div>
      </section>

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
      />

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Public profile</h2>
        <div className="grid gap-6 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Role (KO)</span>
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
          <span className="text-sm font-medium">Quote</span>
          <textarea
            rows={3}
            className={fieldClass}
            value={input.quote}
            onChange={(e) => setInput((v) => ({ ...v, quote: e.target.value }))}
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={input.is_published}
            disabled={!publishAllowed}
            onChange={(e) =>
              setInput((v) => ({ ...v, is_published: e.target.checked }))
            }
            className="size-4 rounded border-border disabled:opacity-50"
          />
          <span className="text-sm font-medium">
            Published on site
            {!publishAllowed && (
              <span className="ml-1 font-normal text-muted-foreground">
                (approve self-registered profile first)
              </span>
            )}
          </span>
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="font-serif text-xl text-foreground">Programs</h2>
        <p className="text-sm text-muted-foreground">
          Add each class or offering. Assign philosophy paths per program for search
          and scheduling.
        </p>
        <ProgramListEditor
          programs={input.programs}
          onChange={(programs) => setInput((v) => ({ ...v, programs }))}
        />
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create person"}
        </button>
        <Link
          href="/admin/partners"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
