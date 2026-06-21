"use client"

import Image from "next/image"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import type { JournalPartnerOption } from "@/lib/journal/partners"
import type { PathKey } from "@/lib/paths/paths-data"
import { PATH_OPTIONS } from "@/lib/paths/paths-data"
import {
  type PartnerKindFilter,
  partnerKindLabel,
  personMatchesPartnerKind,
} from "@/lib/people/partner-kind"
import { getPersonPhotoUrl } from "@/lib/people/utils"

type JournalPartnerPickerProps = {
  partners: JournalPartnerOption[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
}

const KIND_FILTERS: { key: PartnerKindFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "guide", label: "Wellness Guide" },
  { key: "artist", label: "Artist" },
  { key: "brand", label: "Brand" },
]

export function JournalPartnerPicker({
  partners,
  selectedIds,
  onChange,
  disabled = false,
}: JournalPartnerPickerProps) {
  const [search, setSearch] = useState("")
  const [kindFilter, setKindFilter] = useState<PartnerKindFilter>("all")
  const [pathFilters, setPathFilters] = useState<PathKey[]>([])

  const selectedPartners = useMemo(
    () =>
      selectedIds
        .map((id) => partners.find((p) => p.id === id))
        .filter((p): p is JournalPartnerOption => Boolean(p)),
    [partners, selectedIds],
  )

  const available = useMemo(() => {
    const q = search.trim().toLowerCase()
    return partners.filter((partner) => {
      if (selectedIds.includes(partner.id)) return false
      if (!personMatchesPartnerKind(partner, kindFilter)) return false
      if (pathFilters.length > 0) {
        const hasPath = partner.path_keys.some((key) =>
          pathFilters.includes(key as PathKey),
        )
        if (!hasPath) return false
      }
      if (q) {
        const haystack = `${partner.name_en} ${partner.name_ko}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [partners, selectedIds, kindFilter, pathFilters, search])

  const togglePartner = (id: string) => {
    if (disabled) return
    onChange([...selectedIds, id])
  }

  const removePartner = (id: string) => {
    if (disabled) return
    onChange(selectedIds.filter((value) => value !== id))
  }

  const togglePath = (key: PathKey) => {
    setPathFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Partner tags</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Link to Wellness Guide, Artist, or Brand profile pages — shown at the
          bottom of the article with photo and name.
        </p>
      </div>

      {selectedPartners.length > 0 ? (
        <ul className="flex flex-wrap gap-3">
          {selectedPartners.map((partner) => (
            <li
              key={partner.id}
              className="flex items-center gap-2 rounded-full border border-border bg-card/60 py-1 pl-1 pr-3"
            >
              <div className="relative size-8 overflow-hidden rounded-full bg-muted">
                <Image
                  src={getPersonPhotoUrl(partner.photo_path)}
                  alt=""
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {partner.name_en}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {partnerKindLabel(partner.kind)}
                </p>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => removePartner(partner.id)}
                className="ml-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                aria-label={`Remove ${partner.name_en}`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No partners tagged yet.</p>
      )}

      <div className="space-y-4 rounded-xl border border-border bg-card/40 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            disabled={disabled}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search partners…"
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.key}
              type="button"
              disabled={disabled}
              onClick={() => setKindFilter(filter.key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                kindFilter === filter.key
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Philosophy paths
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Optional filter when browsing the partner list.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {PATH_OPTIONS.map((path) => {
              const checked = pathFilters.includes(path.key)
              return (
                <label
                  key={path.key}
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors ${
                    checked
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="size-3.5 rounded border-border"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => togglePath(path.key)}
                  />
                  {path.labelKo}
                </label>
              )
            })}
          </div>
        </div>

        <ul className="max-h-56 space-y-1 overflow-y-auto">
          {available.length === 0 ? (
            <li className="py-6 text-center text-sm text-muted-foreground">
              No matching partners.
            </li>
          ) : (
            available.map((partner) => (
              <li key={partner.id}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => togglePartner(partner.id)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
                >
                  <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={getPersonPhotoUrl(partner.photo_path)}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {partner.name_en}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {partner.name_ko} · {partnerKindLabel(partner.kind)}
                    </p>
                  </div>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
