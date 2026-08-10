"use client"

import type React from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Eraser, ArrowDown } from "lucide-react"
import { useLang } from "@/components/language-provider"

type Point = { x: number; y: number }

const T = {
  en: {
    headline: "Draw what wellness feels like to you",
    moveSlowly: "Move slowly. A wave, a breath, a gentle curve — anything. There is no wrong line.",
    seoye1: "Seoye, the Korean art of calligraphy, was practiced for centuries",
    seoye2: "as a discipline of focus, patience, and self-cultivation.",
    clear: "Clear the canvas",
    explore: "Explore",
  },
  ko: {
    headline: "당신에게 웰니스란 어떤 느낌인가요, 그려보세요",
    moveSlowly: "천천히. 물결이든, 숨결이든, 부드러운 곡선이든 — 무엇이든 좋아요. 틀린 선은 없습니다.",
    seoye1: "서예(書藝)는 수백 년 동안 집중과 인내,",
    seoye2: "그리고 자기 수양의 수행으로 이어져 왔습니다.",
    clear: "화면 지우기",
    explore: "둘러보기",
  },
}

export function HeroCanvas() {
  const { lang } = useLang()
  const t = T[lang]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cursorRef = useRef<HTMLDivElement>(null)
  const drawing = useRef(false)
  const last = useRef<Point | null>(null)
  const lastMid = useRef<Point | null>(null)
  const lastWidth = useRef(12)
  const strokeCount = useRef(0)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(false)

  // Keep the canvas backing store in sync with its display size + DPR.
  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    // Preserve existing drawing across resizes.
    const snapshot = document.createElement("canvas")
    snapshot.width = canvas.width
    snapshot.height = canvas.height
    snapshot.getContext("2d")?.drawImage(canvas, 0, 0)

    canvas.width = Math.max(1, Math.floor(rect.width * dpr))
    canvas.height = Math.max(1, Math.floor(rect.height * dpr))
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.drawImage(snapshot, 0, 0, snapshot.width / dpr, snapshot.height / dpr)
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener("resize", resize)
    return () => window.removeEventListener("resize", resize)
  }, [resize])

  const getPoint = (e: PointerEvent | React.PointerEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  // Move the brush cursor and tilt it slightly toward the direction of travel.
  const moveCursor = (e: React.PointerEvent, angle: number | null) => {
    const el = cursorRef.current
    if (!el) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rot = angle === null ? -35 : (angle * 180) / Math.PI + 90
    el.style.transform = `translate(${x}px, ${y}px) rotate(${rot}deg)`
  }

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    drawing.current = true
    const p = getPoint(e)
    last.current = p
    lastMid.current = p
    lastWidth.current = 12
    canvasRef.current?.setPointerCapture(e.pointerId)
    if (!hasDrawn) setHasDrawn(true)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")

    if (!drawing.current) {
      moveCursor(e, null)
      return
    }
    if (!canvas || !ctx || !last.current || !lastMid.current) return

    const p = getPoint(e)
    const from = last.current
    const prevMid = lastMid.current
    const dx = p.x - from.x
    const dy = p.y - from.y
    const dist = Math.hypot(dx, dy)
    const angle = Math.atan2(dy, dx)
    moveCursor(e, angle)

    // Ink-brush width: slower = fuller, faster = drier/thinner. Smoothed so it
    // swells and tapers instead of jittering segment to segment.
    const target = Math.max(2, 20 - dist * 0.9)
    const width = lastWidth.current + (target - lastWidth.current) * 0.4
    lastWidth.current = width

    // Continuous midpoint smoothing: curve from the previous midpoint through
    // the current point (as control) to the new midpoint — no gaps between
    // segments, so fast strokes stay connected.
    const mid = { x: (from.x + p.x) / 2, y: (from.y + p.y) / 2 }
    const ink = "42, 38, 33"

    ctx.lineJoin = "round"
    ctx.lineCap = "round"

    // 1) Soft bleed halo — the ink soaking into paper (번짐).
    ctx.strokeStyle = `rgba(${ink}, 0.05)`
    ctx.lineWidth = width * 2.4
    ctx.beginPath()
    ctx.moveTo(prevMid.x, prevMid.y)
    ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y)
    ctx.stroke()

    // 2) Main wet stroke with a slight blurred edge.
    ctx.save()
    ctx.shadowColor = `rgba(${ink}, 0.35)`
    ctx.shadowBlur = 2.5
    ctx.strokeStyle = `rgba(${ink}, 0.9)`
    ctx.lineWidth = width
    ctx.beginPath()
    ctx.moveTo(prevMid.x, prevMid.y)
    ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y)
    ctx.stroke()
    ctx.restore()

    // 3) Dry-brush flecks when the stroke moves fast — the brush skips.
    if (dist > 14) {
      const flecks = Math.min(4, Math.floor(dist / 12))
      ctx.fillStyle = `rgba(${ink}, 0.28)`
      for (let i = 0; i < flecks; i++) {
        const t = Math.random()
        const nx = -Math.sin(angle)
        const ny = Math.cos(angle)
        const off = (Math.random() - 0.5) * width * 1.6
        const fx = from.x + dx * t + nx * off
        const fy = from.y + dy * t + ny * off
        ctx.beginPath()
        ctx.arc(fx, fy, Math.random() * 1.2 + 0.3, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    last.current = p
    lastMid.current = mid
  }

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (drawing.current) strokeCount.current += 1
    drawing.current = false
    last.current = null
    canvasRef.current?.releasePointerCapture(e.pointerId)
  }

  const clear = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    strokeCount.current = 0
    setHasDrawn(false)
  }

  return (
    <section id="top" className="relative min-h-svh w-full overflow-hidden">
      {/* Background photo of the space, softened */}
      <div className="absolute inset-0">
        <Image
          src="/images/mugunghwa-hero-wide.png"
          alt="An ink-and-wash painting of mugunghwa, the Korean rose of Sharon"
          fill
          priority
          className="scale-110 object-cover object-[30%_center]"
        />
        <div className="absolute inset-0 bg-background/45" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/10 to-background" />
        {/* Soft glow behind the text so blossoms never compete with the copy */}
        <div className="absolute inset-0 [background:radial-gradient(60%_55%_at_50%_45%,var(--background)_0%,color-mix(in_oklch,var(--background)_55%,transparent)_45%,transparent_75%)]" />
      </div>

      {/* Drawing surface sits above the photo but below the text/UI */}
      <canvas
        ref={canvasRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={(e) => {
          end(e)
          setCursorVisible(false)
        }}
        onPointerEnter={() => setCursorVisible(true)}
        onPointerCancel={end}
        className="absolute inset-0 z-10 h-full w-full touch-none cursor-none"
        aria-label="Interactive ink canvas. Click and drag to draw."
      />

      {/* Brush-tip cursor that follows the pointer */}
      <div
        ref={cursorRef}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-30 -ml-1 -mt-1 transition-opacity duration-200 ${
          cursorVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{ willChange: "transform" }}
      >
        <svg width="30" height="46" viewBox="0 0 30 46" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* bamboo handle */}
          <rect x="12" y="1" width="6" height="17" rx="3" fill="#b8a68c" />
          <rect x="12" y="1" width="3" height="17" rx="1.5" fill="#cdbfa6" />
          {/* metal ferrule */}
          <rect x="10" y="16" width="10" height="6" rx="2" fill="#7c766b" />
          {/* ink-soaked bristles tapering to a point */}
          <path d="M10 21 Q6 33 15 45 Q24 33 20 21 Z" fill="#2a2621" />
          <path d="M13 22 Q12 34 15 44 Q18 34 17 22 Z" fill="#000000" opacity="0.55" />
        </svg>
      </div>

      {/* Foreground content — pointer-events-none so drawing works around it */}
      <div className="pointer-events-none relative z-20 flex min-h-svh flex-col items-center justify-center px-6 text-center">
        {/* This block fades away once the visitor starts drawing */}
        <div
          className={`flex flex-col items-center transition-opacity duration-1000 ${
            hasDrawn ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="relative mx-auto h-72 sm:h-[26rem]">
            {/* Square box matching the logo image so the stamped circle lines up */}
            <div className="relative mx-auto h-full aspect-square">
              {/* The wave paints itself in from left to right */}
              <div className="animate-brush-reveal absolute inset-0">
                <Image
                  src="/images/wellness-korea-mark.png"
                  alt="The Wellness Korea logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              {/* The beige circle is stamped down once the wave finishes */}
              <div
                aria-hidden="true"
                className="animate-circle-stamp absolute left-[65.5%] top-[34%] aspect-square w-[10.5%] rounded-full bg-accent"
              />
            </div>
          </div>

          <p className="-mt-8 max-w-2xl font-serif text-3xl leading-tight text-foreground text-balance sm:-mt-16 sm:text-5xl">
            {t.headline}
          </p>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-foreground/90 text-pretty sm:text-xl">
            {t.moveSlowly}
          </p>
          <p className="mx-auto mt-4 max-w-2xl font-serif text-base italic leading-relaxed text-muted-foreground text-balance sm:text-xl">
            {t.seoye1}
            <br />
            {t.seoye2}
          </p>
        </div>

        {/* Clear button stays available so the canvas — and the words — can return */}
        <div
          className={`pointer-events-auto mt-8 flex items-center gap-3 transition-opacity duration-700 ${
            hasDrawn ? "opacity-100" : "opacity-0"
          }`}
        >
          <button
            onClick={clear}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-5 py-2.5 text-sm text-foreground backdrop-blur-sm transition-colors hover:bg-card"
          >
            <Eraser className="h-4 w-4" aria-hidden="true" />
            {t.clear}
          </button>
        </div>
      </div>

      {/* Scroll cue */}
      <a
        href="#philosophy"
        className="pointer-events-auto absolute inset-x-0 bottom-6 z-20 mx-auto flex w-fit flex-col items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Scroll to explore"
      >
        <span className="text-xs uppercase tracking-widest">{t.explore}</span>
        <ArrowDown className="h-4 w-4 animate-bounce" aria-hidden="true" />
      </a>
    </section>
  )
}
