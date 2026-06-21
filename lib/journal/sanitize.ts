import DOMPurify from "isomorphic-dompurify"

const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "blockquote",
  "strong",
  "em",
  "a",
  "ul",
  "ol",
  "li",
  "img",
  "br",
]

const ALLOWED_ATTR = ["href", "src", "alt", "title", "target", "rel"]

/** Strip and allowlist journal body HTML for storage and public render. */
export function sanitizeJournalHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ""

  return DOMPurify.sanitize(trimmed, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP:
      /^(?:(?:https?|mailto):|\/|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  })
}
