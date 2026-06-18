import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Bust CDN/browser cache when storage object is overwritten at a stable path. */
export function withStorageCacheVersion(
  url: string,
  cacheVersion?: string | null,
): string {
  if (!cacheVersion) return url
  return `${url}?v=${encodeURIComponent(cacheVersion)}`
}
