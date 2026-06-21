import { journalMarkdownToHtml } from "./markdown-to-html"

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function estimateReadMinutes(body: string): number {
  const text = body.includes("<") ? stripHtml(body) : body
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/**
 * Public render: convert legacy Markdown → HTML only.
 * Admin save runs `sanitizeJournalHtml` first — skip DOMPurify here (jsdom breaks on Vercel SSR).
 */
export function journalBodyToHtml(body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return ""
  if (trimmed.startsWith("<")) return trimmed
  return journalMarkdownToHtml(trimmed)
}
