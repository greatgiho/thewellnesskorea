"use client"

import { useMemo, useState } from "react"
import Image from "next/image"
import { Search } from "lucide-react"
import type { PersonWithPrograms } from "@/lib/people/types"
import { getPersonPhotoUrl, sortPeopleByName } from "@/lib/people/utils"

type InstructorSearchPickerProps = {
  instructors: PersonWithPrograms[]
  value: string
  onChange: (instructorId: string) => void
  disabled?: boolean
}

function matchesInstructorSearch(person: PersonWithPrograms, query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    person.name_ko.toLowerCase().includes(q) ||
    person.name_en.toLowerCase().includes(q) ||
    person.role_ko.toLowerCase().includes(q) ||
    person.role_en.toLowerCase().includes(q) ||
    person.programs.some((program) => program.title.toLowerCase().includes(q))
  )
}

export function InstructorSearchPicker({
  instructors,
  value,
  onChange,
  disabled,
}: InstructorSearchPickerProps) {
  const [search, setSearch] = useState("")
  const [listOpen, setListOpen] = useState(false)

  const selected = instructors.find((p) => p.id === value)

  const results = useMemo(() => {
    const filtered = instructors.filter((p) => matchesInstructorSearch(p, search))
    return sortPeopleByName(filtered).slice(0, 12)
  }, [instructors, search])

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  const clearSelection = () => {
    onChange("")
    setSearch("")
    setListOpen(true)
  }

  const selectInstructor = (personId: string) => {
    onChange(personId)
    setSearch("")
    setListOpen(false)
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-foreground">Instructor</span>

      {selected ? (
        <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-3">
          <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-secondary">
            <Image
              src={getPersonPhotoUrl(selected.photo_path)}
              alt=""
              fill
              className="object-cover"
              sizes="44px"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {selected.name_en}
              <span className="text-muted-foreground"> · {selected.name_ko}</span>
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {selected.role_en}
            </p>
          </div>
          <button
            type="button"
            disabled={disabled}
            onClick={clearSelection}
            className="shrink-0 text-sm text-primary underline-offset-4 hover:underline disabled:opacity-50"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              disabled={disabled}
              onChange={(e) => {
                setSearch(e.target.value)
                setListOpen(true)
              }}
              onFocus={() => setListOpen(true)}
              placeholder="Search instructor by name or program…"
              className={`${fieldClass} pl-9`}
              aria-label="Search instructors"
              aria-expanded={listOpen}
              aria-controls="instructor-search-results"
            />
          </div>

          {listOpen && (
            <ul
              id="instructor-search-results"
              className="max-h-52 overflow-y-auto rounded-xl border border-border bg-background shadow-sm"
            >
              {instructors.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">
                  No wellness guides yet. Add one in People.
                </li>
              ) : results.length === 0 ? (
                <li className="px-3 py-3 text-sm text-muted-foreground">
                  No instructors match your search.
                </li>
              ) : (
                results.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/60 disabled:opacity-50"
                      onClick={() => selectInstructor(person.id)}
                    >
                      <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-secondary">
                        <Image
                          src={getPersonPhotoUrl(person.photo_path)}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {person.name_en}
                          <span className="text-muted-foreground">
                            {" "}
                            · {person.name_ko}
                          </span>
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {person.role_en}
                          {person.programs.length > 0 && (
                            <>
                              {" "}
                              · {person.programs.map((p) => p.title).join(", ")}
                            </>
                          )}
                        </p>
                      </div>
                    </button>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
