import Image from "next/image"
import Link from "next/link"
import { ActivityRegionDisplay } from "@/components/partners/activity-region-display"
import { pathLabelKo } from "@/lib/paths/paths-data"
import type { RegionRow } from "@/lib/regions/types"
import {
  isSelfRegistered,
  REGISTRATION_STATUS_BADGE_CLASS,
  registrationStatusLabel,
} from "@/lib/partners/registration-status"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import { getPartnerPhotoUrl, instagramHandle } from "@/lib/partners/utils"

type PartnerDetailViewProps = {
  person: PartnerWithPrograms
  sido: RegionRow[]
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function PartnerDetailView({ person, sido }: PartnerDetailViewProps) {
  const instagram = instagramHandle(person.instagram)

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
        <div className="relative size-40 shrink-0 overflow-hidden rounded-2xl bg-secondary">
          <Image
            src={getPartnerPhotoUrl(person.photo_path)}
            alt=""
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <h2 className="font-serif text-3xl font-light text-foreground">
              {person.name_en}
            </h2>
            <p className="mt-1 text-lg text-muted-foreground">{person.name_ko}</p>
            <p className="mt-2 text-sm text-foreground">
              {person.role_en} · {person.role_ko}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-border px-2.5 py-0.5 text-xs capitalize text-muted-foreground">
              {person.kind}
            </span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                REGISTRATION_STATUS_BADGE_CLASS[person.registration_status]
              }`}
            >
              {registrationStatusLabel(person.registration_status)}
            </span>
            {isSelfRegistered(person.registration_status, person.user_id) && (
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[10px] text-muted-foreground">
                Self-registered
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
                person.is_published
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {person.is_published ? "Published" : "Not published"}
            </span>
          </div>
          {person.quote && (
            <blockquote className="border-l-2 border-primary/30 pl-4 text-sm italic leading-relaxed text-foreground/80">
              {person.quote}
            </blockquote>
          )}
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h3 className="font-medium text-foreground">Contact</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <DetailField label="Email">
            {person.email ? (
              <a
                href={`mailto:${person.email}`}
                className="text-primary underline-offset-4 hover:underline"
              >
                {person.email}
              </a>
            ) : (
              "—"
            )}
          </DetailField>
          <DetailField label="Phone">{person.phone ?? "—"}</DetailField>
          <DetailField label="Instagram">
            {instagram && person.instagram ? (
              <a
                href={person.instagram.startsWith("http") ? person.instagram : `https://instagram.com/${instagram.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                {instagram}
              </a>
            ) : (
              "—"
            )}
          </DetailField>
          <DetailField label="Account linked">
            {person.user_id ? "Yes" : "No"}
          </DetailField>
        </dl>
      </section>

      <section className="rounded-2xl border border-border bg-card/40 p-6">
        <h3 className="font-medium text-foreground">Activity regions</h3>
        <div className="mt-4">
          <ActivityRegionDisplay
            regions={person.activity_regions}
            sido={sido}
            locale="ko"
            emptyLabel="Not set"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-medium text-foreground">
          Programs ({person.programs.length})
        </h3>
        {person.programs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No programs listed.</p>
        ) : (
          <ul className="space-y-3">
            {person.programs.map((program) => (
              <li
                key={program.id}
                className="rounded-2xl border border-border bg-card/40 p-5"
              >
                <p className="font-medium text-foreground">{program.title}</p>
                {program.description && (
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {program.description}
                  </p>
                )}
                {program.path_keys?.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {program.path_keys.map((key) => (
                      <span
                        key={key}
                        className="rounded-full border border-primary/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary/80"
                      >
                        {pathLabelKo(key)}
                      </span>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {person.rejection_reason && (
        <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <h3 className="text-sm font-medium text-destructive">Rejection reason</h3>
          <p className="mt-2 text-sm text-foreground">{person.rejection_reason}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <Link
          href={`/admin/partners/${person.id}/edit`}
          className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Edit profile
        </Link>
        <Link
          href="/admin/partners"
          className="inline-flex h-9 items-center rounded-lg border border-border px-4 text-sm text-foreground hover:bg-muted"
        >
          Back to list
        </Link>
      </div>
    </div>
  )
}
