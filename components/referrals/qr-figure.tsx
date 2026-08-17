"use client"

import { useRef, useState } from "react"

/**
 * The QR, plus a way to take it away.
 *
 * The SVG is rendered on the server and handed in as children; this reads it
 * back out of the DOM rather than being passed the markup as a prop. A page can
 * show a dozen of these, and sending each one twice — once as HTML, once as a
 * string for the client — would double the payload to save a querySelector.
 *
 * The name arrives already built and cleaned by qrFilename(), which is where
 * that decision can be tested.
 */

const BUTTON =
  "rounded-full border border-border px-3 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-60"

/** Big enough to print at a card size without the modules going soft. */
const RASTER_PX = 1024

function sized(svg: SVGSVGElement, px: number): string {
  const clone = svg.cloneNode(true) as SVGSVGElement
  // The library emits a viewBox and no width/height, which is right for the
  // page and useless to anything rasterising it.
  clone.setAttribute("width", String(px))
  clone.setAttribute("height", String(px))
  if (!clone.getAttribute("xmlns")) {
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg")
  }
  return new XMLSerializer().serializeToString(clone)
}

function save(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function QrFigure({
  filename,
  size = "sm",
  children,
}: {
  filename: string
  size?: "sm" | "lg"
  children: React.ReactNode
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [busy, setBusy] = useState(false)
  const name = filename || "twk-qr"

  const svg = () => boxRef.current?.querySelector("svg") ?? null

  const downloadSvg = () => {
    const el = svg()
    if (!el) return
    save(
      new Blob([sized(el, RASTER_PX)], { type: "image/svg+xml;charset=utf-8" }),
      `${name}.svg`,
    )
  }

  const downloadPng = async () => {
    const el = svg()
    if (!el) return
    setBusy(true)
    try {
      const source = URL.createObjectURL(
        new Blob([sized(el, RASTER_PX)], { type: "image/svg+xml;charset=utf-8" }),
      )
      try {
        const image = new Image()
        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => reject(new Error("QR 이미지를 그리지 못했습니다."))
          image.src = source
        })

        const canvas = document.createElement("canvas")
        canvas.width = RASTER_PX
        canvas.height = RASTER_PX
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        // Painted white first: a PNG with a transparent background prints as
        // whatever is under it, and a QR on grey does not scan.
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, RASTER_PX, RASTER_PX)
        ctx.drawImage(image, 0, 0, RASTER_PX, RASTER_PX)

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        )
        if (blob) save(blob, `${name}.png`)
      } finally {
        URL.revokeObjectURL(source)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`shrink-0 ${size === "lg" ? "w-[220px]" : "w-[112px]"}`}>
      <div
        ref={boxRef}
        className="rounded-xl bg-white p-2 [&>div]:contents [&_svg]:h-auto [&_svg]:w-full"
      >
        {children}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" onClick={downloadSvg} className={BUTTON}>
          SVG
        </button>
        <button
          type="button"
          onClick={downloadPng}
          disabled={busy}
          className={BUTTON}
        >
          {busy ? "…" : "PNG"}
        </button>
      </div>
    </div>
  )
}
