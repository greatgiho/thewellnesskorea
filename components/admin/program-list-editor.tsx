"use client"

import type { PathKey } from "@/lib/paths/paths-data"
import type { PersonProgramFormInput } from "@/lib/people/types"
import { PhilosophyPathPicker } from "./philosophy-path-picker"

type ProgramListEditorProps = {
  programs: PersonProgramFormInput[]
  onChange: (programs: PersonProgramFormInput[]) => void
}

const emptyProgram = (): PersonProgramFormInput => ({
  clientKey: crypto.randomUUID(),
  title: "",
  description: "",
  path_keys: [],
})

export function ProgramListEditor({ programs, onChange }: ProgramListEditorProps) {
  const updateAt = (index: number, patch: Partial<PersonProgramFormInput>) => {
    onChange(programs.map((p, i) => (i === index ? { ...p, ...patch } : p)))
  }

  const removeAt = (index: number) => {
    onChange(programs.filter((_, i) => i !== index))
  }

  const addProgram = () => {
    onChange([...programs, emptyProgram()])
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"

  return (
    <div className="space-y-4">
      {programs.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No programs yet. Add what this teacher can offer.
        </p>
      )}

      {programs.map((program, index) => (
        <div
          key={program.id ?? program.clientKey ?? index}
          className="rounded-2xl border border-border bg-card/50 p-4 space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Program {index + 1}
            </p>
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="text-xs text-destructive hover:underline"
            >
              Remove
            </button>
          </div>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Program title</span>
            <input
              required
              className={fieldClass}
              placeholder="e.g. Hatha Yoga, Singing Bowl Sound Bath"
              value={program.title}
              onChange={(e) => updateAt(index, { title: e.target.value })}
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium">Description (optional)</span>
            <textarea
              rows={2}
              className={fieldClass}
              value={program.description}
              onChange={(e) => updateAt(index, { description: e.target.value })}
            />
          </label>

          <div className="space-y-2">
            <span className="text-sm font-medium">Philosophy paths</span>
            <p className="text-xs text-muted-foreground">
              Select all paths this program belongs to (used for search and filters).
            </p>
            <PhilosophyPathPicker
              namePrefix={`program-${index}`}
              value={program.path_keys}
              onChange={(path_keys: PathKey[]) => updateAt(index, { path_keys })}
            />
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addProgram}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-dashed border-primary/50 px-4 text-sm font-medium text-primary transition-colors hover:bg-primary/5"
      >
        + Add program
      </button>
    </div>
  )
}
