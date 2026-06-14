import { FooterBrandColumn } from "./footer-brand-column"
import { FooterBottomBar } from "./footer-bottom-bar"
import { FooterLinkColumns } from "./footer-link-columns"

export function Footer() {
  return (
    <footer id="footer" className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-28">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-10">
          <FooterBrandColumn />
          <FooterLinkColumns />
        </div>
        <FooterBottomBar />
      </div>
    </footer>
  )
}
