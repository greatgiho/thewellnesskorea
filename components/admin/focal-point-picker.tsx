"use client"

import { useCallback, useRef } from "react"

type Props = {
  /** Full URL of the uploaded/existing cover image. */
  imageUrl: string
  /** CSS object-position string, e.g. '50% 50%' or '32% 24%'. */
  value: string
  onChange: (value: string) => void
}

function parseFocalPoint(value: string): [number, number] {
  const m = value.match(/^(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%$/)
  if (!m) return [50, 50]
  return [parseFloat(m[1]), parseFloat(m[2])]
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

/**
 * Visual focal point picker for the journal admin editor.
 *
 * - Click anywhere on the image to place the focal point.
 * - Arrow keys (focus the picker first) move the marker 1% at a time;
 *   hold Shift for 5% steps.
 * - Two number inputs for direct entry, synced bidirectionally with the picker.
 * - A 16:9 preview box shows how the image crops at the current focal point.
 */
export function FocalPointPicker({ imageUrl, value, onChange }: Props) {
  const pickerRef = useRef<HTMLDivElement>(null)
  const [x, y] = parseFocalPoint(value)

  const emit = useCallback(
    (nx: number, ny: number) => {
      onChange(`${clamp(nx)}% ${clamp(ny)}%`)
    },
    [onChange],
  )

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = pickerRef.current?.getBoundingClientRect()
      if (!rect) return
      const nx = ((e.clientX - rect.left) / rect.width) * 100
      const ny = ((e.clientY - rect.top) / rect.height) * 100
      emit(nx, ny)
    },
    [emit],
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const step = e.shiftKey ? 5 : 1
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault()
          emit(x - step, y)
          break
        case "ArrowRight":
          e.preventDefault()
          emit(x + step, y)
          break
        case "ArrowUp":
          e.preventDefault()
          emit(x, y - step)
          break
        case "ArrowDown":
          e.preventDefault()
          emit(x, y + step)
          break
      }
    },
    [x, y, emit],
  )

  return (
    <div className="space-y-5">
      {/* ── Click picker ── */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Focal point
          <span className="ml-2 font-normal text-xs text-muted-foreground">
            — click the image to set where the camera stays during cropping
          </span>
        </p>

        {/* Picker image */}
        <div
          ref={pickerRef}
          role="button"
          tabIndex={0}
          aria-label={`Focal point picker. Current: ${x}% horizontal, ${y}% vertical. Arrow keys to adjust, Shift for 5% steps.`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="relative aspect-[4/3] max-w-md cursor-crosshair overflow-hidden rounded-xl border border-border select-none focus:outline-none focus:ring-2 focus:ring-ring/60"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Cover — click to set focal point"
            className="size-full object-cover pointer-events-none"
            draggable={false}
          />

          {/* Crosshair marker */}
          <div
            aria-hidden
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {/* Outer ring */}
            <div className="size-8 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.4)] transition-all duration-75" />
            {/* Horizontal line */}
            <div
              aria-hidden
              className="absolute top-1/2 -translate-y-1/2 bg-white/70"
              style={{ left: "-24px", width: "80px", height: "1px" }}
            />
            {/* Vertical line */}
            <div
              aria-hidden
              className="absolute left-1/2 -translate-x-1/2 bg-white/70"
              style={{ top: "-24px", height: "80px", width: "1px" }}
            />
            {/* Center dot */}
            <div className="absolute left-1/2 top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Arrow keys to nudge · Shift + arrow for 5% steps
        </p>
      </div>

      {/* ── Number inputs ── */}
      <div className="flex flex-wrap items-end gap-4">
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Horizontal %
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={x}
            onChange={(e) => emit(Number(e.target.value), y)}
            className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs font-medium text-muted-foreground">
            Vertical %
          </span>
          <input
            type="number"
            min={0}
            max={100}
            value={y}
            onChange={(e) => emit(x, Number(e.target.value))}
            className="w-20 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
        </label>
        <p className="pb-2 text-xs text-muted-foreground">
          Value:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-foreground">
            {value}
          </code>
        </p>
      </div>

      {/* ── 16:9 fullscreen preview ── */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Fullscreen preview
          <span className="ml-2 font-normal text-xs text-muted-foreground">
            — simulates desktop 16:9 crop at the chosen focal point
          </span>
        </p>
        <div className="relative aspect-video max-w-md overflow-hidden rounded-xl border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Fullscreen crop preview"
            className="size-full object-cover pointer-events-none"
            style={{ objectPosition: value }}
            draggable={false}
          />
          {/* Gradient overlay matching the actual story display */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/20 to-transparent"
          />
          <p className="absolute bottom-2 left-3 text-[0.6rem] uppercase tracking-[0.2em] text-white/60">
            Desktop 16:9
          </p>
        </div>
      </div>
    </div>
  )
}
