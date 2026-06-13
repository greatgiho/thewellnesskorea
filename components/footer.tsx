import { ArrowRight } from "lucide-react"

const footerLinks = {
  Brand: ["Philosophy", "Why Korea", "The Approach", "Journal"],
  Place: ["Brickwell", "Seochon", "Visit", "Private Sessions"],
}

const socials = [
  {
    label: "Instagram",
    path: "M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.12.32-.27.8-.31 1.7C3.4 8.5 3.4 8.85 3.4 12s0 3.5.07 4.74c.04.9.19 1.38.31 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.12.8.27 1.7.31 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.31.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.12-.32.27-.8.31-1.7.07-1.24.07-1.59.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.31-1.7a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.12-.8-.27-1.7-.31C15.5 4 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 17a4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-2.96a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z",
  },
  {
    label: "Facebook",
    path: "M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z",
  },
  {
    label: "YouTube",
    path: "M21.58 7.19a2.51 2.51 0 0 0-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42A2.51 2.51 0 0 0 2.42 7.2 26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0 .42 4.81 2.51 2.51 0 0 0 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42a2.51 2.51 0 0 0 1.77-1.77A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81ZM10 15V9l5.2 3-5.2 3Z",
  },
]

export function Footer() {
  return (
    <footer id="footer" className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-5">
            <p className="font-serif text-3xl font-medium tracking-tight">
              The Wellness Korea
            </p>
            <p className="mt-5 max-w-sm text-pretty leading-relaxed text-background/70">
              A premium K-Wellness brand for living your time well. Receive
              seasonal letters, quiet practices, and news from Brickwell.
            </p>

            <form className="mt-8 max-w-sm">
              <div className="flex items-center gap-3 border-b border-background/30 pb-3 transition-colors focus-within:border-background">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  aria-label="Email address"
                  className="w-full bg-transparent text-sm text-background placeholder:text-background/50 focus:outline-none"
                />
                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="shrink-0 text-background transition-transform duration-300 hover:translate-x-1"
                >
                  <ArrowRight className="size-5" />
                </button>
              </div>
            </form>

            <div className="mt-9 flex gap-4">
              {socials.map((social) => (
                <a
                  key={social.label}
                  href="#"
                  aria-label={social.label}
                  className="flex size-10 items-center justify-center rounded-full border border-background/25 transition-colors duration-300 hover:bg-background hover:text-foreground"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="size-4"
                    aria-hidden="true"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

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
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-background/20 pt-8 text-xs text-background/60 sm:flex-row">
          <p>© {new Date().getFullYear()} The Wellness Korea. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-background">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-background">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
