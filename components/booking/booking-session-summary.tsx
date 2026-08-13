import Image from "next/image"
import { formatBookingDateTime } from "@/lib/bookings/format"
import { getSessionPhotoUrl } from "@/lib/schedule/images"
import type { BookingSummary } from "@/lib/bookings/queries"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { mapSessionToClassItem } from "@/lib/schedule/map-public-class"

/**
 * The three snapshot blocks, in the order the admin form asks for them.
 *
 * Headings are English to match the labels beside them (Date, Time, Floor);
 * the text itself is whatever was typed, in whichever language. There is no
 * ko/en split on description_blocks yet.
 */
const DESCRIPTION_BLOCKS = [
  { key: "intro", label: "About" },
  { key: "progress", label: "Programme" },
  { key: "preparation", label: "What to bring" },
] as const

type BookingSessionSummaryProps = {
  session?: SessionWithRelations | null
  summary?: BookingSummary | null
}

export function BookingSessionSummary({
  session,
  summary,
}: BookingSessionSummaryProps) {
  const title = summary?.sessionTitle ?? session?.title ?? "Class"
  const startsAt = summary?.sessionStartsAt ?? session?.starts_at
  const endsAt = summary?.sessionEndsAt ?? session?.ends_at
  const floorName =
    summary?.floorName ??
    (session?.is_all_floors ? "All floors" : session?.floor?.name_en) ??
    "Brickwell"
  const instructorName =
    summary?.instructorName ?? session?.instructor?.name_en ?? "Wellness Guide"

  if (!startsAt || !endsAt) return null

  const { heading, timeRange } = formatBookingDateTime(startsAt, endsAt)

  // Either source will do: the reservation page has the whole session, the
  // confirmation screen has a summary carrying the same snapshot. Reading both
  // here is what stops "what to bring" from existing on one screen and not on
  // the next one the same person sees.
  const snapshot = session
    ? { images: session.image_paths ?? [], blocks: session.description_blocks }
    : summary?.snapshot

  const images = (snapshot?.images ?? []).slice(0, 3)
  const blocks = DESCRIPTION_BLOCKS.map((b) => ({
    ...b,
    text: snapshot?.blocks?.[b.key]?.trim() ?? "",
  })).filter((b) => b.text)
  const spots =
    session != null
      ? mapSessionToClassItem(session).spots
      : null

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      {/* Never cropped.
          What gets uploaded here is not photography — it is posters. The ones
          in production are 1080×1350 with the headline, the logo, the dates and
          in one case the entire timetable set as pixels. A fixed frame with
          object-cover cut the title off the top and the dates off the bottom of
          the first, and reduced the timetable to four unreadable lines.
          object-contain gives that up: an image that does not match the frame
          gets bars instead of losing half its content.
          4:5 because that is the format the studio actually produces, so the
          common case fills the frame exactly and no bars appear at all.
          Stacked rather than one large and two small, since a poster shrunk to
          a thumbnail is a poster nobody can read. */}
      {images.length > 0 ? (
        <div className="mb-6 space-y-3">
          {images.map((path) => (
            <div
              key={path}
              className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-2xl bg-secondary/30"
            >
              <Image
                src={getSessionPhotoUrl(path)}
                alt=""
                fill
                sizes="(min-width: 640px) 28rem, 100vw"
                className="object-contain"
              />
            </div>
          ))}
        </div>
      ) : null}

      <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
        Class details
      </p>
      <h2 className="mt-3 font-serif text-2xl font-light text-foreground">
        {title}
      </h2>
      <dl className="mt-6 space-y-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Date</dt>
          <dd className="mt-0.5 text-foreground">{heading}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Time</dt>
          <dd className="mt-0.5 text-foreground">{timeRange}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Floor</dt>
          <dd className="mt-0.5 text-foreground">{floorName}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Guide</dt>
          <dd className="mt-0.5 text-foreground">{instructorName}</dd>
        </div>
        {spots != null ? (
          <div>
            <dt className="text-muted-foreground">Availability</dt>
            <dd className="mt-0.5 text-foreground">
              {spots === 0 ? "Full" : `${spots} spots left`}
            </dd>
          </div>
        ) : null}
      </dl>

      {/* What the admin form has always said appears here. Blank blocks are
          dropped entirely — an empty "What to bring" heading is not
          information, it is a promise of some. */}
      {blocks.length > 0 ? (
        <div className="mt-8 space-y-6 border-t border-border pt-6">
          {blocks.map((b) => (
            <div key={b.key}>
              <h3 className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">
                {b.label}
              </h3>
              {/* pre-line, because 진행 is a timetable. Collapsed to one
                  paragraph it stops being one. */}
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
