"use client"

import Image from "next/image"
import { useState } from "react"
import { savePartnerPhoto } from "@/app/p/profile-actions"
import { uploadPersonPhoto } from "@/lib/partners/photo-upload"
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/ui/photo-upload"

type Props = {
  partnerId: string
  initialUrl: string
}

/**
 * The partner's own photo, with a way to replace it.
 *
 * Uploads from the browser like every other image in the app, then hands the
 * path to a server action — storage only accepts a write inside this
 * partner's folder, and the action re-checks the same thing before recording
 * it.
 */
export function PartnerProfilePhoto({ partnerId, initialUrl }: Props) {
  const [url, setUrl] = useState(initialUrl)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const problem = validateImageFile(file)
    if (problem) {
      setError(problem)
      return
    }

    setError(null)
    setPending(true)
    // Show the new photo straight away; the upload takes a moment and the
    // partner has already seen what they picked.
    const preview = URL.createObjectURL(file)
    const previous = url
    setUrl(preview)

    try {
      const path = await uploadPersonPhoto(partnerId, file)
      const result = await savePartnerPhoto(path)
      if (!result.ok) throw new Error(result.error)
    } catch (err) {
      setUrl(previous)
      setError(
        err instanceof Error ? err.message : "Failed to save the photo.",
      )
    } finally {
      URL.revokeObjectURL(preview)
      setPending(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-secondary">
        <Image
          src={url}
          alt=""
          fill
          className="object-cover"
          unoptimized={url.startsWith("blob:")}
          priority
        />
      </div>

      <label className="inline-flex cursor-pointer items-center rounded-full border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary has-disabled:opacity-60">
        {pending ? "올리는 중…" : "사진 변경"}
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          onChange={onPick}
          disabled={pending}
          className="hidden"
        />
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
