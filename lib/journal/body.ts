import { journalMarkdownToHtml } from "./markdown-to-html"
import { sanitizeJournalHtml } from "./sanitize"

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function estimateReadMinutes(body: string): number {
  const text = body.includes("<") ? stripHtml(body) : body
  const words = text.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

/** Normalize stored body to sanitized HTML (TipTap HTML or legacy Markdown). */
export function journalBodyToHtml(body: string): string {
  const trimmed = body.trim()
  if (!trimmed) return ""
  const html = trimmed.startsWith("<")
    ? trimmed
    : journalMarkdownToHtml(trimmed)
  return sanitizeJournalHtml(html)
}
