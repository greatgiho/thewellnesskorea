export function FooterBottomBar() {
  return (
    <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-background/20 pt-8 text-xs text-background/60 sm:flex-row">
      <p>
        © {new Date().getFullYear()} The Wellness Korea. All rights reserved.
      </p>
      <div className="flex gap-6">
        <a href="#" className="transition-colors hover:text-background">
          Privacy
        </a>
        <a href="#" className="transition-colors hover:text-background">
          Terms
        </a>
      </div>
    </div>
  )
}
