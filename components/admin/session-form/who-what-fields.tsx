"use client"

import type { PathKey } from "@/lib/paths/paths-data"
import type { PartnerWithPrograms } from "@/lib/partners/types"
import { InstructorSearchPicker } from "@/components/admin/instructor-search-picker"
import { PhilosophyPathPicker } from "@/components/admin/philosophy-path-picker"
import type { SessionFieldsProps } from "@/components/admin/session-form/fields"

/**
 * Who teaches it and what it is called.
 *
 * One group because picking an instructor rewrites the rest of it: choosing a
 * person clears the programme, the title and the paths, since those came from
 * whoever was selected before. Splitting them would put that reset across a
 * component boundary and make it look like a bug.
 */
export function WhoWhatFields({
  input,
  setInput,
  fieldClass,
  instructors,
  allPartners,
  selectedInstructor,
  programs,
  disabled,
  onProgramChange,
  instructorKey,
}: SessionFieldsProps & {
  instructors: PartnerWithPrograms[]
  allPartners: PartnerWithPrograms[]
  selectedInstructor: PartnerWithPrograms | undefined
  programs: { id: string; title: string }[]
  disabled: boolean
  onProgramChange: (programId: string) => void
  /** Remounts the picker when the dialog switches to another session. */
  instructorKey: string
}) {
  return (
    <>
      <InstructorSearchPicker
        key={instructorKey}
        instructors={instructors}
        allPartners={allPartners}
        value={input.instructor_id}
        disabled={disabled}
        onChange={(instructorId) =>
          setInput((v) => ({
            ...v,
            instructor_id: instructorId,
            partner_program_id: null,
            title: "",
            path_keys: [],
          }))
        }
      />

      {selectedInstructor && programs.length > 0 && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Program</span>
          <select
            className={fieldClass}
            value={input.partner_program_id ?? ""}
            onChange={(e) => onProgramChange(e.target.value)}
          >
            <option value="">Custom title</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Program fills title and paths as a starting point. Session content
            stays a snapshot.
          </p>
        </label>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Title</span>
        <input
          required
          className={fieldClass}
          value={input.title}
          onChange={(e) => setInput((v) => ({ ...v, title: e.target.value }))}
        />
      </label>

      {/* The column has existed since 049 and the list card has always
          read it, but there was nowhere to type it — so every card fell
          back to the full intro and became a wall of text. */}
      <div className="space-y-1.5">
        <span className="text-sm font-medium">
          한 줄 소개{" "}
          <span className="font-normal text-muted-foreground">(목록 카드)</span>
        </span>
        <input
          className={fieldClass}
          placeholder="EN — 비우면 목록 카드에 소개가 안 나옵니다"
          value={input.blurb_en}
          onChange={(e) => setInput((v) => ({ ...v, blurb_en: e.target.value }))}
        />
        <input
          className={fieldClass}
          placeholder="KO"
          value={input.blurb_ko}
          onChange={(e) => setInput((v) => ({ ...v, blurb_ko: e.target.value }))}
        />
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium">Philosophy paths</span>
        <PhilosophyPathPicker
          namePrefix="session"
          value={input.path_keys}
          onChange={(path_keys: PathKey[]) =>
            setInput((v) => ({ ...v, path_keys }))
          }
        />
      </div>
    </>
  )
}
