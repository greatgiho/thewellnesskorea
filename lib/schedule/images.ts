import { extFromMime } from "@/lib/partners/utils"
import type { SessionDescriptionBlocks } from "./types"

export const SESSION_PHOTOS_BUCKET = "session-photos"
export const MAX_SESSION_IMAGES = 3

export const EMPTY_SESSION_DESCRIPTION: SessionDescriptionBlocks = {
  intro: "",
  progress: "",
  preparation: "",
}

export const SESSION_DESCRIPTION_FIELDS: {
  key: keyof SessionDescriptionBlocks
  label: string
  placeholder: string
}[] = [
  {
    key: "intro",
    label: "소개",
    placeholder: "수업 소개, 대상, 분위기 등",
  },
  {
    key: "progress",
    label: "진행",
    placeholder: "수업 흐름, 시간 배분, 진행 방식",
  },
  {
    key: "preparation",
    label: "준비물",
    placeholder: "복장, 준비물, 도착 시간 등",
  },
]

export function getSessionPhotoUrl(path: string | null | undefined): string {
  if (!path) return "/placeholder.svg"
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!base) return "/placeholder.svg"
  return `${base}/storage/v1/object/public/${SESSION_PHOTOS_BUCKET}/${path}`
}

export function sessionPhotoStoragePath(
  sessionId: string,
  index: number,
  ext: string,
): string {
  return `${sessionId}/img-${index}.${ext}`
}

export function normalizeDescriptionBlocks(
  value: unknown,
): SessionDescriptionBlocks {
  if (!value || typeof value !== "object") return { ...EMPTY_SESSION_DESCRIPTION }
  const obj = value as Record<string, unknown>
  return {
    intro: typeof obj.intro === "string" ? obj.intro : "",
    progress: typeof obj.progress === "string" ? obj.progress : "",
    preparation: typeof obj.preparation === "string" ? obj.preparation : "",
  }
}

export function extFromPath(path: string): string {
  const part = path.split(".").pop()
  return part && part.length <= 4 ? part : "jpg"
}

export function storagePathFromFile(sessionId: string, index: number, file: File): string {
  return sessionPhotoStoragePath(sessionId, index, extFromMime(file.type))
}
