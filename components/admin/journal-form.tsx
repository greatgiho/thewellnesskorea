"use client"

import { FocalPointPicker } from "@/components/admin/focal-point-picker"
import { JournalEditor } from "@/components/admin/journal-editor"
import { JournalPartnerPicker } from "@/components/admin/journal-partner-picker"
import { estimateReadMinutes } from "@/lib/journal/body"
import { JOURNAL_CATEGORIES } from "@/lib/journal/copy"
import {
  emptyJournalInput,
  journalInputFromPost,
  slugFromJournalTitle,
} from "@/lib/journal/form-state"
import type { JournalPartnerOption } from "@/lib/journal/partners"
import { getJournalPhotoUrl, validateJournalPhotoFile } from "@/lib/journal/images"
import { uploadJournalHero } from "@/lib/journal/photo-upload"
import type { JournalFormInput, JournalPostRow } from "@/lib/journal/types"
import { saveJournalPost } from "@/app/admin/journal/actions"
import Image from "next/image"
import Link from "next/link"
import { ImagePlus } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"

type ExperienceOption = {
  id: string
  name_en: string
  kind: string
}

type JournalFormProps = {
  post?: JournalPostRow
  experiences: ExperienceOption[]
  partners: JournalPartnerOption[]
  initialPartnerIds?: string[]
}

export function JournalForm({
  post,
  experiences,
  partners,
  initialPartnerIds = [],
}: JournalFormProps) {
  const router = useRouter()
  const isEdit = Boolean(post)
  const [draftPostId] = useState(() => post?.id ?? crypto.randomUUID())
  const [input, setInput] = useState<JournalFormInput>(() =>
    post ? journalInputFromPost(post, initialPartnerIds) : emptyJournalInput(),
  )
  const [slugTouched, setSlugTouched] = useState(isEdit)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(
    post?.hero_image_path ? getJournalPhotoUrl(post.hero_image_path) : null,
  )
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const readEstimate = useMemo(
    () => estimateReadMinutes(input.body_en),
    [input.body_en],
  )

  const onTitleChange = (title: string) => {
    setInput((v) => ({
      ...v,
      title_en: title,
      slug: slugTouched ? v.slug : slugFromJournalTitle(title),
    }))
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ""
    if (!f) return
    const validationError = validateJournalPhotoFile(f, {
      invalidType: "Cover image must be JPG, PNG, or WebP.",
      tooLarge: "Cover image must be 5 MB or smaller.",
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
      let heroPath: string | null | undefined = undefined
      if (file) {
        heroPath = await uploadJournalHero(draftPostId, file)
      } else if (!post) {
        heroPath = null
      }

      const result = await saveJournalPost(input, post?.id, {
        newPostId: post?.id ? undefined : draftPostId,
        heroPath,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      router.push("/admin/journal")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.")
    } finally {
      setPending(false)
    }
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-10">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Basics</h2>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Title (EN)</span>
          <input
            type="text"
            required
            className={fieldClass}
            value={input.title_en}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Title (KO)</span>
          <input
            type="text"
            className={fieldClass}
            value={input.title_ko}
            onChange={(e) =>
              setInput((v) => ({ ...v, title_ko: e.target.value }))
            }
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Slug</span>
          <input
            type="text"
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className={`${fieldClass} font-mono`}
            value={input.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setInput((v) => ({ ...v, slug: e.target.value }))
            }}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Category</span>
            <select
              className={fieldClass}
              value={input.category}
              onChange={(e) =>
                setInput((v) => ({
                  ...v,
                  category: e.target.value as JournalFormInput["category"],
                }))
              }
            >
              {JOURNAL_CATEGORIES.filter((c) => c.key !== "all").map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Published date</span>
            <input
              type="date"
              required
              className={fieldClass}
              value={input.published_at}
              onChange={(e) =>
                setInput((v) => ({ ...v, published_at: e.target.value }))
              }
            />
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">Excerpt</span>
          <textarea
            required
            rows={3}
            className={fieldClass}
            value={input.excerpt_en}
            onChange={(e) =>
              setInput((v) => ({ ...v, excerpt_en: e.target.value }))
            }
          />
        </label>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={input.is_published}
            onChange={(e) =>
              setInput((v) => ({ ...v, is_published: e.target.checked }))
            }
          />
          <span className="text-sm font-medium">Published (visible on site)</span>
        </label>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-xl text-foreground">Cover image</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Shown on the journal list and at the top of the article.
          </p>
        </div>

        {/* Upload area */}
        <div className="relative aspect-[16/10] max-w-lg overflow-hidden rounded-xl border border-border bg-muted/30">
          {preview ? (
            <>
              <Image
                src={preview}
                alt="Cover preview"
                fill
                className="object-cover"
                unoptimized={preview.startsWith("blob:")}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-4">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => coverInputRef.current?.click()}
                  className="inline-flex h-9 items-center rounded-lg bg-background/95 px-4 text-sm font-medium text-foreground shadow-sm hover:bg-background disabled:opacity-50"
                >
                  Change cover image
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => coverInputRef.current?.click()}
              className="flex size-full flex-col items-center justify-center gap-2 px-6 text-center transition-colors hover:bg-muted/50 disabled:opacity-50"
            >
              <span className="flex size-11 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                <ImagePlus className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">
                Upload cover image
              </span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG, or WebP · max 5 MB
              </span>
            </button>
          )}
        </div>

        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          disabled={pending}
          onChange={onFileChange}
        />

        {/* Focal point picker — shown only when an image is available */}
        {preview && (
          <div className="rounded-xl border border-border bg-card p-5">
            <FocalPointPicker
              imageUrl={preview}
              value={input.focal_point}
              onChange={(fp) => setInput((v) => ({ ...v, focal_point: fp }))}
            />
          </div>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl text-foreground">Body</h2>
          <span className="text-xs text-muted-foreground">
            ~{readEstimate} min read suggested
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Rich text editor — headings, quotes, lists, links, and inline images.
        </p>
        <JournalEditor
          postId={draftPostId}
          content={input.body_en}
          disabled={pending}
          onChange={(html) => setInput((v) => ({ ...v, body_en: html }))}
        />
      </section>

      <section className="space-y-4">
        <JournalPartnerPicker
          partners={partners}
          selectedIds={input.partner_ids}
          disabled={pending}
          onChange={(partner_ids) => setInput((v) => ({ ...v, partner_ids }))}
        />
      </section>

      <section className="space-y-6">
        <h2 className="font-serif text-xl text-foreground">Optional</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium">Read minutes</span>
            <input
              type="number"
              min={1}
              className={fieldClass}
              value={input.read_minutes}
              onChange={(e) =>
                setInput((v) => ({
                  ...v,
                  read_minutes: Number(e.target.value) || readEstimate,
                }))
              }
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium">Linked experience</span>
            <select
              className={fieldClass}
              value={input.experience_id ?? ""}
              onChange={(e) =>
                setInput((v) => ({
                  ...v,
                  experience_id: e.target.value || null,
                }))
              }
            >
              <option value="">None</option>
              {experiences.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.name_en} ({exp.kind})
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="block space-y-2">
          <span className="text-sm font-medium">SEO title</span>
          <input
            type="text"
            className={fieldClass}
            value={input.seo_title}
            onChange={(e) =>
              setInput((v) => ({ ...v, seo_title: e.target.value }))
            }
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium">SEO description</span>
          <textarea
            rows={2}
            className={fieldClass}
            value={input.seo_description}
            onChange={(e) =>
              setInput((v) => ({ ...v, seo_description: e.target.value }))
            }
          />
        </label>
      </section>

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save" : "Create"}
        </button>
        <Link
          href="/admin/journal"
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
        {post?.is_published && (
          <Link
            href={`/journal/${post.slug}`}
            target="_blank"
            className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
          >
            View live
          </Link>
        )}
      </div>
    </form>
  )
}
