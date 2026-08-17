"use client"

import type { FloorRow } from "@/lib/schedule/types"
import { defaultEndTime } from "@/lib/schedule/utils"
import type { SessionFieldsProps } from "@/components/admin/session-form/fields"

/**
 * When the class runs and which floor it takes.
 *
 * The two belong together because they are the same question — a room is only
 * booked for a span of time, and the conflict check the schedule runs is on
 * the pair.
 */
export function WhenWhereFields({
  input,
  setInput,
  fieldClass,
  floors,
  startOptions,
  endOptions,
}: SessionFieldsProps & {
  floors: FloorRow[]
  startOptions: string[]
  endOptions: string[]
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Date</span>
          <input
            type="date"
            required
            className={fieldClass}
            value={input.date}
            onChange={(e) => setInput((v) => ({ ...v, date: e.target.value }))}
          />
        </label>
        <div className="block space-y-1.5">
          <span className="text-sm font-medium">Floor</span>
          <select
            className={fieldClass}
            value={input.floor_id}
            disabled={input.is_all_floors}
            onChange={(e) =>
              setInput((v) => ({ ...v, floor_id: e.target.value }))
            }
          >
            {floors.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name_en} · {f.name_ko}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              checked={input.is_all_floors}
              onChange={(e) =>
                setInput((v) => ({ ...v, is_all_floors: e.target.checked }))
              }
              className="size-4 rounded border-border"
            />
            <span className="text-xs font-medium text-foreground">
              전층 사용 · All floors
            </span>
          </label>
          {input.is_all_floors && (
            <p className="text-xs text-muted-foreground">
              이 시간대에 건물 전체(모든 층)를 점유합니다. 위 층은 대표(홈) 층으로
              저장돼요.
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Start</span>
          <select
            className={fieldClass}
            value={input.start_time}
            onChange={(e) => {
              const start_time = e.target.value
              // Moving the start drags the end with it. Editing one and
              // forgetting the other is how a class ends before it begins.
              setInput((v) => ({
                ...v,
                start_time,
                end_time: defaultEndTime(start_time, 60),
              }))
            }}
          >
            {startOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">End</span>
          <select
            className={fieldClass}
            value={input.end_time}
            onChange={(e) =>
              setInput((v) => ({ ...v, end_time: e.target.value }))
            }
          >
            {endOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
    </>
  )
}
