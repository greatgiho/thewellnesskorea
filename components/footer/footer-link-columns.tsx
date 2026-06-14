const footerLinks = {
  Brand: ["Philosophy", "Why Korea", "The Approach", "Journal"],
  Place: ["Brickwell", "Seochon", "Visit", "Private Sessions"],
}

export function FooterLinkColumns() {
  return (
    <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7">
      {Object.entries(footerLinks).map(([title, links]) => (
        <div key={title}>
          <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-background/60">
            {title}
          </h3>
          <ul className="mt-5 space-y-3">
            {links.map((link) => (
              <li key={link}>
                <a
                  href="#"
                  className="text-sm text-background/85 transition-colors hover:text-background"
                >
                  {link}
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
          <p>hello@thewellnesskorea.com</p>
          <p>+82 2 1234 5678</p>
        </address>
      </div>
    </div>
  )
}
