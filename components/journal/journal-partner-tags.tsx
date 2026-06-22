import Image from "next/image"
import Link from "next/link"
import type { JournalPartnerTag } from "@/lib/journal/partners"
import { partnerKindLabel } from "@/lib/partners/partner-kind"

type JournalPartnerTagsProps = {
  partners: JournalPartnerTag[]
}

export function JournalPartnerTags({ partners }: JournalPartnerTagsProps) {
  if (partners.length === 0) return null

  return (
    <section className="mt-16 border-t border-border pt-12">
      <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
        In this story
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-foreground">
        Partners
      </h2>
      <ul className="mt-8 grid gap-4 sm:grid-cols-2">
        {partners.map((partner) => (
          <li key={partner.id}>
            <Link
              href={`/partners/${partner.slug}`}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-4 transition-colors hover:border-primary/30 hover:bg-card/70"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
                <Image
                  src={partner.image}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground group-hover:text-primary">
                  {partner.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {partnerKindLabel(partner.kind)}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
