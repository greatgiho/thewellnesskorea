"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { InstagramIcon } from "@/components/icons/social-icons"
import type { PersonCardData } from "@/lib/people/types"
import { instagramHandle } from "@/lib/people/utils"

type PersonCardProps = {
  person: PersonCardData
}

export function PersonCard({ person }: PersonCardProps) {
  const router = useRouter()
  const handle = instagramHandle(person.instagramUrl)

  const openProfile = () => {
    router.push(`/people/${person.slug}`)
  }

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openProfile}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          openProfile()
        }
      }}
      className="group w-[300px] shrink-0 cursor-pointer snap-start sm:w-[340px]"
    >
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-card shadow-[0_20px_50px_-20px_rgba(28,40,33,0.25)] transition-opacity hover:opacity-95">
        <div className="relative aspect-[4/5] shrink-0 overflow-hidden">
          <Image
            src={person.image || "/placeholder.svg"}
            alt={`Portrait of ${person.name}, ${person.role}`}
            fill
            sizes="340px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        <div className="flex h-[272px] flex-col p-7">
          <div className="flex shrink-0 items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-serif text-2xl font-medium text-foreground">
                {person.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-sm text-primary">
                {person.role}
              </p>
              {person.primaryRegionLabel && (
                <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                  {person.primaryRegionLabel}
                </p>
              )}
            </div>
            {person.instagramUrl && (
              <a
                href={person.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Instagram ${handle ?? person.name}`}
                onClick={(event) => event.stopPropagation()}
                className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                <InstagramIcon className="size-4" />
              </a>
            )}
          </div>

          {person.programs.length > 0 && (
            <div className="mt-4 min-h-0 flex-1 overflow-hidden">
              <div className="line-clamp-3 space-y-2">
                {person.programs.map((program) => (
                  <div key={program.title} className="space-y-1.5">
                    <span className="inline-block max-w-full truncate rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                      {program.title}
                    </span>
                    {program.pathLabels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 overflow-hidden">
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
            </div>
          )}

          <div className="mt-auto min-h-[3.25rem] shrink-0 border-t border-border pt-4">
            {person.quote ? (
              <p className="line-clamp-2 font-serif text-base font-light italic leading-snug text-foreground/80">
                &ldquo;{person.quote}&rdquo;
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">View profile</p>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
