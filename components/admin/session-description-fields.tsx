import type { SessionDescriptionBlocks } from "@/lib/schedule/types"
import {
  SESSION_DESCRIPTION_FIELDS,
} from "@/lib/schedule/images"

type SessionDescriptionFieldsProps = {
  value: SessionDescriptionBlocks
  onChange: (value: SessionDescriptionBlocks) => void
}

export function SessionDescriptionFields({
  value,
  onChange,
}: SessionDescriptionFieldsProps) {
  const fieldClass =
    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 min-h-[88px] resize-y"

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Class details</p>
        <p className="text-xs text-muted-foreground">
          Shown on the booking detail screen (session snapshot).
        </p>
      </div>
      {SESSION_DESCRIPTION_FIELDS.map((field) => (
        <label key={field.key} className="block space-y-1.5">
          <span className="text-sm font-medium">{field.label}</span>
          <textarea
            className={fieldClass}
            value={value[field.key]}
            placeholder={field.placeholder}
            onChange={(e) =>
              onChange({ ...value, [field.key]: e.target.value })
            }
            rows={3}
          />
        </label>
      ))}
    </div>
  )
}
