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

const ALLOWED_URI_REGEXP =
  /^(?:(?:https?|mailto):|\/|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i

/** Strip and allowlist journal body HTML for storage and public render. */
export function sanitizeJournalHtml(html: string): string {
  const trimmed = html.trim()
  if (!trimmed) return ""

  try {
    // Dynamic require keeps isomorphic-dompurify out of the module's top-level
    // import graph so that a load failure in certain serverless environments
    // degrades gracefully instead of crashing the entire server action module.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("isomorphic-dompurify") as {
      default?: { sanitize: (h: string, opts: object) => string }
      sanitize?: (h: string, opts: object) => string
    }
    const DOMPurify = mod.default ?? mod
    if (typeof DOMPurify.sanitize !== "function") {
      throw new Error("DOMPurify.sanitize not a function")
    }
    return DOMPurify.sanitize(trimmed, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP,
    })
  } catch (err) {
    // DOMPurify unavailable — TipTap editor already restricts to safe tags.
    console.error("[sanitize] DOMPurify failed, using passthrough:", err)
    return trimmed
  }
}
