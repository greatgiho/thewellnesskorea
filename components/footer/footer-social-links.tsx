import {
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "@/components/icons/social-icons"

const socialLinks = [
  { label: "Instagram", href: "#", icon: InstagramIcon },
  { label: "Facebook", href: "#", icon: FacebookIcon },
  { label: "YouTube", href: "#", icon: YoutubeIcon },
] as const

export function FooterSocialLinks() {
  return (
    <div className="mt-9 flex gap-4">
      {socialLinks.map((social) => {
        const Icon = social.icon
        return (
          <a
            key={social.label}
            href={social.href}
            aria-label={social.label}
            className="flex size-10 items-center justify-center rounded-full border border-background/25 transition-colors duration-300 hover:bg-background hover:text-foreground"
          >
            <Icon className="size-4" />
          </a>
        )
      })}
    </div>
  )
}
