import type { PathKey } from "@/lib/paths/paths-data"
import { PATH_OPTIONS } from "@/lib/paths/paths-data"

type PhilosophyPathPickerProps = {
  value: PathKey[]
  onChange: (keys: PathKey[]) => void
  namePrefix: string
}

export function PhilosophyPathPicker({
  value,
  onChange,
  namePrefix,
}: PhilosophyPathPickerProps) {
  const toggle = (key: PathKey) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key))
    } else {
      onChange([...value, key])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PATH_OPTIONS.map((path) => {
        const checked = value.includes(path.key)
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
              onChange={() => toggle(path.key)}
              name={`${namePrefix}-${path.key}`}
            />
            <span>{path.labelKo}</span>
          </label>
        )
      })}
    </div>
  )
}
