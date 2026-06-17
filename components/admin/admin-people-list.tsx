"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import type { PathKey } from "@/lib/paths/paths-data"
import { PATH_OPTIONS } from "@/lib/paths/paths-data"
import type { PersonRegistrationStatus, PersonWithPrograms } from "@/lib/people/types"
import {
  isSelfRegistered,
  REGISTRATION_STATUS_BADGE_CLASS,
  registrationStatusLabel,
} from "@/lib/people/registration-status"
import { getPersonPhotoUrl, sortPeopleByName } from "@/lib/people/utils"

type AdminPeopleListProps = {
  people: PersonWithPrograms[]
  applyLink: string
}

type StatusFilter = "all" | "submitted" | "self" | PersonRegistrationStatus

function personMatchesStatus(
  person: PersonWithPrograms,
  filter: StatusFilter,
): boolean {
  if (filter === "all") return true
  if (filter === "self") return isSelfRegistered(person.registration_status)
  return person.registration_status === filter
}

function personMatchesPhilosophy(person: PersonWithPrograms, paths: PathKey[]) {
  if (paths.length === 0) return true
  return person.programs.some((program) =>
    program.path_keys?.some((key) => paths.includes(key)),
  )
}

function personMatchesSearch(person: PersonWithPrograms, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    person.name_ko.toLowerCase().includes(q) ||
    person.name_en.toLowerCase().includes(q) ||
    person.role_ko.toLowerCase().includes(q) ||
    person.role_en.toLowerCase().includes(q) ||
    (person.email?.toLowerCase().includes(q) ?? false) ||
    (person.phone?.includes(q) ?? false) ||
    person.programs.some((program) => program.title.toLowerCase().includes(q))
  )
}

export function AdminPeopleList({ people, applyLink }: AdminPeopleListProps) {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [philosophyFilters, setPhilosophyFilters] = useState<PathKey[]>([])
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [copied, setCopied] = useState(false)

  const copyApplyLink = async () => {
    await navigator.clipboard.writeText(applyLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const filtered = useMemo(() => {
    const list = people.filter(
      (person) =>
        personMatchesSearch(person, search) &&
        personMatchesPhilosophy(person, philosophyFilters) &&
        personMatchesStatus(person, statusFilter),
    )
    return sortPeopleByName(list)
  }, [people, search, philosophyFilters, statusFilter])

  const togglePhilosophy = (key: PathKey) => {
    setPhilosophyFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const fieldClass =
    "h-9 w-full min-w-[200px] rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 sm:max-w-xs"

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, program…"
            className={`${fieldClass} pl-9`}
            aria-label="Search people"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={copyApplyLink}
            className="inline-flex h-9 items-center rounded-lg border border-primary/40 px-4 text-sm font-medium text-primary hover:bg-primary/5"
          >
            {copied ? "Copied!" : "Copy apply link"}
          </button>
          <Link
            href="/admin/people/new"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90"
          >
            Add person
          </Link>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Teacher self-registration: {applyLink} · code{" "}
        <span className="font-mono">twk2026</span>
      </p>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ["all", "All"],
            ["submitted", "Pending review"],
            ["approved", "Approved"],
            ["rejected", "Rejected"],
            ["self", "Self-registered"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setStatusFilter(key)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === key
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card/40 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Philosophy paths
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Show teachers with at least one program in the selected paths.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PATH_OPTIONS.map((path) => {
            const checked = philosophyFilters.includes(path.key)
            return (
              <label
                key={path.key}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs transition-colors ${
                  checked
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/40"
                }`}
              >
                <input
                  type="checkbox"
                  className="size-3.5 rounded border-border"
                  checked={checked}
                  onChange={() => togglePhilosophy(path.key)}
                />
                <span>{path.labelKo}</span>
                <span className="text-muted-foreground">· {path.labelEn}</span>
              </label>
            )
          })}
          {philosophyFilters.length > 0 && (
            <button
              type="button"
              onClick={() => setPhilosophyFilters([])}
              className="text-xs text-primary underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filtered.length} of {people.length} shown · sorted by name (EN), then registration
        date
      </p>

      {people.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
          No people yet.{" "}
          <Link
            href="/admin/people/new"
            className="text-primary underline-offset-4 hover:underline"
          >
            Add the first profile
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted-foreground">
          No matches. Try adjusting search or philosophy filters.
        </div>
      ) : (
        <div className="-mx-6 overflow-x-auto px-6 sm:mx-0 sm:px-0">
          <div className="min-w-[720px] overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Photo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Kind</th>
                <th className="px-4 py-3 font-medium">Programs</th>
                <th className="px-4 py-3 font-medium">Philosophy</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((p) => {
                const pathLabels = [
                  ...new Set(
                    p.programs.flatMap((program) => program.path_keys ?? []),
                  ),
                ]
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer bg-card transition-colors hover:bg-muted/40"
                    onClick={() => router.push(`/admin/people/${p.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="relative size-10 overflow-hidden rounded-lg bg-secondary">
                        <Image
                          src={getPersonPhotoUrl(p.photo_path)}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{p.name_en}</p>
                      <p className="text-xs text-muted-foreground">{p.name_ko}</p>
                      {isSelfRegistered(p.registration_status, p.user_id) && (
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          Self-registered
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{p.kind}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.programs.length}</td>
                    <td className="px-4 py-3">
                      {pathLabels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {pathLabels.map((key) => (
                            <span
                              key={key}
                              className="rounded-full border border-primary/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wider text-primary/80"
                            >
                              {PATH_OPTIONS.find((o) => o.key === key)?.labelKo ?? key}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {p.email && <p>{p.email}</p>}
                      {p.phone && <p>{p.phone}</p>}
                      {!p.email && !p.phone && "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          REGISTRATION_STATUS_BADGE_CLASS[p.registration_status]
                        }`}
                      >
                        {registrationStatusLabel(p.registration_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_published ? (
                        <span className="text-primary">Yes</span>
                      ) : (
                        <span className="text-muted-foreground">No</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/people/${p.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}
    </div>
  )
}
