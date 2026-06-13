import Image from "next/image"
import type { PersonCardData } from "@/lib/people/types"
import { instagramHandle } from "@/lib/people/utils"

type PersonCardProps = {
  person: PersonCardData
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.21 15.58 2.2 15.2 2.2 12s0-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.21 8.8 2.2 12 2.2Zm0 1.8c-3.15 0-3.5 0-4.74.07-.9.04-1.38.19-1.7.31-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.12.32-.27.8-.31 1.7C3.4 8.5 3.4 8.85 3.4 12s0 3.5.07 4.74c.04.9.19 1.38.31 1.7.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.12.8.27 1.7.31 1.24.07 1.59.07 4.74.07s3.5 0 4.74-.07c.9-.04 1.38-.19 1.7-.31.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.12-.32.27-.8.31-1.7.07-1.24.07-1.59.07-4.74s0-3.5-.07-4.74c-.04-.9-.19-1.38-.31-1.7a2.85 2.85 0 0 0-.69-1.06 2.85 2.85 0 0 0-1.06-.69c-.32-.12-.8-.27-1.7-.31C15.5 4 15.15 4 12 4Zm0 3.06A4.94 4.94 0 1 1 12 17a4.94 4.94 0 0 1 0-9.88Zm0 1.8a3.14 3.14 0 1 0 0 6.28 3.14 3.14 0 0 0 0-6.28Zm5.14-2.96a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3Z" />
    </svg>
  )
}

export function PersonCard({ person }: PersonCardProps) {
  const handle = instagramHandle(person.instagramUrl)

  return (
    <article className="group w-[300px] shrink-0 snap-start sm:w-[340px]">
      <div className="overflow-hidden rounded-3xl bg-card shadow-[0_20px_50px_-20px_rgba(28,40,33,0.25)]">
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image
            src={person.image || "/placeholder.svg"}
            alt={`Portrait of ${person.name}, ${person.role}`}
            fill
            sizes="340px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="p-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-2xl font-medium text-foreground">
                {person.name}
              </h3>
              <p className="mt-1 text-sm text-primary">{person.role}</p>
            </div>
            {person.instagramUrl && (
              <a
                href={person.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${handle ?? person.name}`}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <InstagramIcon className="size-4" />
              </a>
            )}
          </div>

          {person.programs.length > 0 && (
            <div className="mt-4 space-y-3">
              {person.programs.map((program) => (
                <div key={program.title} className="space-y-2">
                  <span className="inline-block rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    {program.title}
                  </span>
                  {program.pathLabels.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {program.pathLabels.map((label) => (
                        <span
                          key={`${program.title}-${label}`}
                          className="rounded-full border border-primary/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary/80"
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {person.quote && (
            <p className="mt-6 border-t border-border pt-5 font-serif text-lg font-light italic leading-snug text-foreground/80">
              &ldquo;{person.quote}&rdquo;
            </p>
          )}
        </div>
      </div>
    </article>
  )
}
