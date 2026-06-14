import Image from "next/image"
import { InstagramIcon } from "@/components/icons/social-icons"
import type { PersonCardData } from "@/lib/people/types"
import { instagramHandle } from "@/lib/people/utils"

type PersonCardProps = {
  person: PersonCardData
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
