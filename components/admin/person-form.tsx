"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import type { PersonFormInput, PersonWithPrograms } from "@/lib/people/types"
import { activityRegionCodesFromRows } from "@/lib/regions/utils"
import type { RegionsForForms } from "@/lib/regions/types"
import { ActivityRegionFields } from "@/components/people/activity-region-fields"
import { savePerson } from "@/app/admin/actions"
import { canPublishPerson } from "@/lib/people/registration-status"
import {
  extFromMime,
  getPersonPhotoUrl,
  instagramHandle,
  PERSON_KINDS,
  photoStoragePath,
} from "@/lib/people/utils"
import { ProgramListEditor } from "@/components/admin/program-list-editor"

type PersonFormProps = {
  person?: PersonWithPrograms
  regions: RegionsForForms
}

const defaultInput: PersonFormInput = {
  kind: "guide",
  name_ko: "",
  name_en: "",
  role_ko: "",
  role_en: "",
  quote: "",
  phone: "",
  email: "",
  instagram: "",
  is_published: false,
  primary_region_code: "",
  secondary_region_code: "",
  programs: [],
}

function formFromPerson(person: PersonWithPrograms): PersonFormInput {
  const { primary, secondary } = activityRegionCodesFromRows(person.activity_regions)
  return {
    kind: person.kind,
    name_ko: person.name_ko,
    name_en: person.name_en,
    role_ko: person.role_ko,
    role_en: person.role_en,
    quote: person.quote ?? "",
    phone: person.phone ?? "",
    email: person.email ?? "",
    instagram: instagramHandle(person.instagram) ?? person.instagram ?? "",
    is_published: person.is_published,
    primary_region_code: primary,
    secondary_region_code: secondary,
    programs: person.programs.map((p) => ({
      title: p.title,
      description: p.description ?? "",
      path_keys: p.path_keys ?? [],
    })),
  }
}

export function PersonForm({ person, regions }: PersonFormProps) {
  const router = useRouter()
  const isEdit = Boolean(person)
  const [input, setInput] = useState<PersonFormInput>(
    person ? formFromPerson(person) : defaultInput,
  )
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(
    person ? getPersonPhotoUrl(person.photo_path) : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const publishAllowed = person
    ? canPublishPerson(person.registration_status)
    : true

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("Use JPG, PNG, or WebP.")
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("Max file size is 5MB.")
      return
    }
    setError(null)
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const uploadPhotoFile = async (
    personId: string,
    photo: File,
  ): Promise<string> => {
    const supabase = createClient()
    const ext = extFromMime(photo.type)
    const path = photoStoragePath(personId, ext)

    const { error: uploadError } = await supabase.storage
      .from("person-photos")
      .upload(path, photo, { upsert: true, contentType: photo.type })

    if (uploadError) throw new Error(uploadError.message)
    return path
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setPending(true)
    try {
      const personId = person?.id ?? crypto.randomUUID()
      let photoPath: string | null | undefined = undefined
      if (file) {
        photoPath = await uploadPhotoFile(personId, file)
      } else if (!person) {
        photoPath = null
      }

      await savePerson(input, person?.id, {
        newPersonId: person?.id ? undefined : personId,
        photoPath,
      })
      router.push("/admin/people")
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
        <h2 className="font-serif text-xl text-foreground">Type</h2>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Kind</span>
          <select
            className={fieldClass}
            value={input.kind}
            onChange={(e) =>
              setInput((v) => ({
                ...v,
                kind: e.target.value as PersonFormInput["kind"],
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

        <div className="space-y-3">
          <span className="text-sm font-medium">Profile photo</span>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            {preview && (
              <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl border border-border">
                <Image src={preview} alt="Preview" fill className="object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onFileChange}
              className="text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
          </div>
        </div>

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
          href="/admin/people"
          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}
