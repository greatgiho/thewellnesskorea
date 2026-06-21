import Image from "next/image"
import Link from "next/link"
import { InstagramIcon } from "@/components/icons/social-icons"
import { ActivityRegionDisplay } from "@/components/people/activity-region-display"
import { pathLabelKo } from "@/lib/paths/paths-data"
import { partnerKindLabel } from "@/lib/people/partner-kind"
import type { PersonWithPrograms } from "@/lib/people/types"
import { getPersonPhotoUrl, instagramHandle } from "@/lib/people/utils"
import type { RegionRow } from "@/lib/regions/types"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { PersonUpcomingSessions } from "./person-upcoming-sessions"

type PersonProfileViewProps = {
  person: PersonWithPrograms
  sessions: SessionWithRelations[]
  sido: RegionRow[]
}

function backHrefForKind(kind: PersonWithPrograms["kind"]): string {
  if (kind === "brand") return "/journal"
  if (kind === "artist") return "/#arts"
  return "/#guides"
}

function backLabelForKind(kind: PersonWithPrograms["kind"]): string {
  if (kind === "brand") return "Journal"
  if (kind === "artist") return "Artists"
  if (kind === "guide") return "Wellness Guides"
  return "Wellness Guides"
}

export function PersonProfileView({ person, sessions, sido }: PersonProfileViewProps) {
  const instagram = instagramHandle(person.instagram)
  const backHref = backHrefForKind(person.kind)
  const backLabel = backLabelForKind(person.kind)

  return (
    <div className="mx-auto max-w-4xl px-6 py-12 lg:px-10 lg:py-16">
      <Link
        href={backHref}
        className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
      >
        ← Back to {backLabel}
      </Link>

      <div className="mt-8 flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-14">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-sm shrink-0 overflow-hidden rounded-3xl bg-secondary lg:mx-0 lg:max-w-xs">
          <Image
            src={getPersonPhotoUrl(person.photo_path)}
            alt={`Portrait of ${person.name_en}`}
            fill
            sizes="(max-width: 1024px) 100vw, 320px"
            className="object-cover"
            priority
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
            {partnerKindLabel(person.kind)}
          </p>
          <h1 className="mt-4 font-serif text-4xl font-light text-foreground sm:text-5xl">
            {person.name_en}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{person.name_ko}</p>
          <p className="mt-4 text-base text-foreground">
            {person.role_en}
            <span className="text-muted-foreground"> · {person.role_ko}</span>
          </p>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Activity regions
            </p>
            <div className="mt-2">
              <ActivityRegionDisplay
                regions={person.activity_regions}
                sido={sido}
                locale="en"
                emptyLabel="Not listed"
              />
            </div>
          </div>

          {person.instagram && instagram && (
            <a
              href={
                person.instagram.startsWith("http")
                  ? person.instagram
                  : `https://instagram.com/${instagram.replace("@", "")}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              <InstagramIcon className="size-4" />
              {instagram}
            </a>
          )}

          {person.quote && (
            <blockquote className="mt-8 border-l-2 border-primary/30 pl-5 font-serif text-xl font-light italic leading-relaxed text-foreground/85">
              &ldquo;{person.quote}&rdquo;
            </blockquote>
          )}
        </div>
      </div>

      {person.programs.length > 0 && (
        <section className="mt-16 space-y-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-primary">
              Programs
            </p>
            <h2 className="mt-3 font-serif text-3xl font-light text-foreground sm:text-4xl">
              What they offer
            </h2>
          </div>
          <ul className="space-y-4">
            {person.programs.map((program) => (
              <li
                key={program.id}
                className="rounded-2xl border border-border bg-card/50 p-6"
              >
                <p className="font-serif text-xl font-medium text-foreground">
                  {program.title}
                </p>
                {program.description && (
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {program.description}
                  </p>
                )}
                {program.path_keys?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {program.path_keys.map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-primary/20 px-2.5 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary/80"
                      >
                        {pathLabelKo(key)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {person.kind !== "brand" && (
        <div className="mt-16 border-t border-border pt-16">
          <PersonUpcomingSessions sessions={sessions} />
        </div>
      )}
    </div>
  )
}
