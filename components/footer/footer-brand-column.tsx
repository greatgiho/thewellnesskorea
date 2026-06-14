import { ArrowRight } from "lucide-react"
import { FooterSocialLinks } from "./footer-social-links"

export function FooterBrandColumn() {
  return (
    <div className="lg:col-span-5">
      <p className="font-serif text-3xl font-medium tracking-tight">
        The Wellness Korea
      </p>
      <p className="mt-5 max-w-sm text-pretty leading-relaxed text-background/70">
        A premium K-Wellness brand for living your time well. Receive seasonal
        letters, quiet practices, and news from Brickwell.
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

      <FooterSocialLinks />
    </div>
  )
}
