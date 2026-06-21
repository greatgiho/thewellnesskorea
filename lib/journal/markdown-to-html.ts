/** One-time conversion for legacy Markdown seed copy → TipTap HTML. */
export function journalMarkdownToHtml(markdown: string): string {
  return markdown
    .split(/\n\n+/)
    .map((block) => {
      const trimmed = block.trim()
      if (!trimmed) return ""

      if (trimmed.startsWith("> ")) {
        const quote = trimmed.replace(/^>\s?/gm, "").trim()
        return `<blockquote><p>${escapeHtml(quote)}</p></blockquote>`
      }

      if (trimmed.startsWith("## ")) {
        return `<h2>${escapeHtml(trimmed.replace(/^##\s/, ""))}</h2>`
      }

      return `<p>${escapeHtml(trimmed)}</p>`
    })
    .filter(Boolean)
    .join("")
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
