type FooterLink = {
  label: string
  href: string
}

const footerLinks: Record<string, FooterLink[]> = {
  Brand: [
    { label: "Philosophy", href: "#philosophy" },
    { label: "Why Korea", href: "#why-korea" },
    { label: "The Approach", href: "#paths" },
  ],
  Place: [
    { label: "Brickwell", href: "#footer" },
    { label: "Seochon", href: "#footer" },
    { label: "Visit", href: "#visit" },
    { label: "Private Sessions", href: "#schedule" },
  ],
  Sitemap: [
    { label: "Five Paths", href: "#paths" },
    { label: "Wellness Guides", href: "#guides" },
    { label: "Artists", href: "#arts" },
    { label: "Schedule", href: "#schedule" },
  ],
}

export function FooterLinkColumns() {
  return (
    <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-4">
      {Object.entries(footerLinks).map(([title, links]) => (
        <div key={title}>
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-background/60">
            {title}
          </h3>
          <ul className="mt-5 space-y-3">
            {links.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-sm text-background/85 transition-colors hover:text-background"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <div>
        <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-background/60">
          Visit
        </h3>
        <address className="mt-5 space-y-3 text-sm not-italic text-background/85">
          <p>Brickwell, Seochon</p>
          <p>Jongno-gu, Seoul, South Korea</p>
          <p>
            <a
              href="mailto:hello@thewellnesskorea.com"
              className="transition-colors hover:text-background"
            >
              hello@thewellnesskorea.com
            </a>
          </p>
          <p>+82 2 1234 5678</p>
        </address>
      </div>
    </div>
  )
}
