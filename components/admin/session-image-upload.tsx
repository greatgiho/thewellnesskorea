"use client"

import Image from "next/image"
import { useRef } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import {
  getSessionPhotoUrl,
  MAX_SESSION_IMAGES,
  SESSION_PHOTOS_BUCKET,
  SIGNED_OUT_MESSAGE,
  storagePathFromFile,
  unreferencedUploads,
  uploadErrorMessage,
} from "@/lib/schedule/images"

export type SessionImageSlot = {
  path: string | null
  pendingFile: File | null
  previewUrl: string | null
}

type SessionImageUploadProps = {
  slots: SessionImageSlot[]
  onChange: (slots: SessionImageSlot[]) => void
  disabled?: boolean
}

const ACCEPT = "image/jpeg,image/png,image/webp"

function emptySlot(): SessionImageSlot {
  return { path: null, pendingFile: null, previewUrl: null }
}

export function slotsFromPaths(paths: string[]): SessionImageSlot[] {
  const slots: SessionImageSlot[] = paths.map((path) => ({
    path,
    pendingFile: null,
    previewUrl: getSessionPhotoUrl(path),
  }))
  while (slots.length < MAX_SESSION_IMAGES) slots.push(emptySlot())
  return slots.slice(0, MAX_SESSION_IMAGES)
}

export function pathsFromSlots(slots: SessionImageSlot[]): string[] {
  return slots
    .map((s) => s.path)
    .filter((p): p is string => Boolean(p))
    .slice(0, MAX_SESSION_IMAGES)
}

export type SessionImageUploadResult = {
  /** Every path the session row should reference: kept plus newly uploaded. */
  paths: string[]
  /** Only what this call created, so a failed save can drop it again. */
  uploaded: string[]
}

/** Drop uploads that no session row will point at. */
export async function discardUnreferencedUploads(
  uploaded: string[],
  priorPaths: string[],
): Promise<void> {
  const orphans = unreferencedUploads(uploaded, priorPaths)
  if (orphans.length === 0) return
  await createClient().storage.from(SESSION_PHOTOS_BUCKET).remove(orphans)
}

export async function uploadSessionImageSlots(
  sessionId: string,
  slots: SessionImageSlot[],
  priorPaths: string[] = [],
): Promise<SessionImageUploadResult> {
  const supabase = createClient()

  // Ask before writing rather than translating the refusal afterwards: the
  // upload is the first thing in this dialog that needs a browser session, so
  // an expired one surfaces here as a policy error about a table the admin
  // never mentioned.
  if (slots.some((slot) => slot.pendingFile)) {
    const { error } = await supabase.auth.getUser()
    if (error) throw new Error(SIGNED_OUT_MESSAGE)
  }

  const uploaded: string[] = []

  // Settled rather than all: the slots upload concurrently, so a later one can
  // land after an earlier one fails, and those bytes still need clearing.
  const results = await Promise.allSettled(
    slots.map(async (slot, index) => {
      if (slot.pendingFile) {
        const path = storagePathFromFile(sessionId, index, slot.pendingFile)
        const { error } = await supabase.storage
          .from(SESSION_PHOTOS_BUCKET)
          .upload(path, slot.pendingFile, {
            upsert: true,
            contentType: slot.pendingFile.type,
          })
        if (error) throw new Error(uploadErrorMessage(error.message))
        uploaded.push(path)
        return path
      }
      if (slot.path) return slot.path
      return null
    }),
  )

  const failed = results.find((r) => r.status === "rejected")
  if (failed) {
    await discardUnreferencedUploads(uploaded, priorPaths)
    throw failed.reason
  }

  const paths = results
    .map((r) => (r.status === "fulfilled" ? r.value : null))
    .filter((path): path is string => Boolean(path))
    .slice(0, MAX_SESSION_IMAGES)

  return { paths, uploaded }
}

export function SessionImageUpload({
  slots,
  onChange,
  disabled,
}: SessionImageUploadProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const setSlot = (index: number, slot: SessionImageSlot) => {
    onChange(slots.map((s, i) => (i === index ? slot : s)))
  }

  const onPickFile = (index: number, file: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      throw new Error("Use JPG, PNG, or WebP.")
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Max file size is 5MB.")
    }
    setSlot(index, {
      path: null,
      pendingFile: file,
      previewUrl: URL.createObjectURL(file),
    })
  }

  const onRemove = (index: number) => {
    setSlot(index, emptySlot())
    const input = inputRefs.current[index]
    if (input) input.value = ""
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">Photos</p>
        <p className="text-xs text-muted-foreground">
          Up to {MAX_SESSION_IMAGES} images for the booking detail view.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {slots.map((slot, index) => {
          const hasImage = slot.previewUrl
          return (
            <div
              key={index}
              className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-secondary/30"
            >
              {hasImage ? (
                <>
                  <Image
                    src={slot.previewUrl!}
                    alt={`Session photo ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => onRemove(index)}
                      className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm hover:bg-background"
                      aria-label="Remove image"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => inputRefs.current[index]?.click()}
                  className="flex size-full flex-col items-center justify-center gap-1 text-xs text-muted-foreground transition-colors hover:bg-muted/50 disabled:opacity-40"
                >
                  <span>Add</span>
                </button>
              )}
              <input
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="file"
                accept={ACCEPT}
                className="hidden"
                disabled={disabled}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onPickFile(index, file)
                }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
