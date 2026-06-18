"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { ExperienceRow } from "@/lib/experiences/types"

type ExperienceHomeContextValue = {
  experiences: ExperienceRow[]
  activeIndex: number
  goToExperience: (index: number) => void
  setHeroTrackEl: (el: HTMLDivElement | null) => void
  setScheduleTrackEl: (el: HTMLDivElement | null) => void
}

const ExperienceHomeContext = createContext<ExperienceHomeContextValue | null>(
  null,
)

function scrollTrackToIndex(
  track: HTMLDivElement | null,
  index: number,
  behavior: ScrollBehavior = "smooth",
) {
  const slide = track?.children[index] as HTMLElement | undefined
  slide?.scrollIntoView({ behavior, inline: "start", block: "nearest" })
}

function useScrollSnapObserver(
  track: HTMLDivElement | null,
  count: number,
  onIndexChange: (index: number) => void,
) {
  const onIndexChangeRef = useRef(onIndexChange)
  onIndexChangeRef.current = onIndexChange

  useEffect(() => {
    if (!track || count === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (!best) return

        const index = Number((best.target as HTMLElement).dataset.index)
        if (Number.isNaN(index)) return
        onIndexChangeRef.current(index)
      },
      { root: track, threshold: [0.55, 0.65, 0.75] },
    )

    Array.from(track.children).forEach((child, index) => {
      ;(child as HTMLElement).dataset.index = String(index)
      observer.observe(child)
    })

    return () => observer.disconnect()
  }, [track, count])
}

export function ExperienceHomeProvider({
  experiences,
  children,
}: {
  experiences: ExperienceRow[]
  children: ReactNode
}) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [heroTrackEl, setHeroTrackEl] = useState<HTMLDivElement | null>(null)
  const [scheduleTrackEl, setScheduleTrackEl] = useState<HTMLDivElement | null>(
    null,
  )
  const syncLock = useRef(false)
  const syncTimer = useRef<number | null>(null)

  const releaseSyncLock = useCallback(() => {
    if (syncTimer.current !== null) {
      window.clearTimeout(syncTimer.current)
    }
    syncTimer.current = window.setTimeout(() => {
      syncLock.current = false
      syncTimer.current = null
    }, 450)
  }, [])

  const goToExperience = useCallback(
    (index: number) => {
      if (index < 0 || index >= experiences.length) return
      syncLock.current = true
      setActiveIndex(index)
      scrollTrackToIndex(heroTrackEl, index)
      scrollTrackToIndex(scheduleTrackEl, index)
      releaseSyncLock()
    },
    [experiences.length, heroTrackEl, releaseSyncLock, scheduleTrackEl],
  )

  const handleHeroIndex = useCallback(
    (index: number) => {
      if (syncLock.current) return
      setActiveIndex(index)
      syncLock.current = true
      scrollTrackToIndex(scheduleTrackEl, index)
      releaseSyncLock()
    },
    [releaseSyncLock, scheduleTrackEl],
  )

  const handleScheduleIndex = useCallback(
    (index: number) => {
      if (syncLock.current) return
      setActiveIndex(index)
      syncLock.current = true
      scrollTrackToIndex(heroTrackEl, index)
      releaseSyncLock()
    },
    [heroTrackEl, releaseSyncLock],
  )

  useScrollSnapObserver(heroTrackEl, experiences.length, handleHeroIndex)
  useScrollSnapObserver(
    scheduleTrackEl,
    experiences.length,
    handleScheduleIndex,
  )

  useEffect(() => {
    return () => {
      if (syncTimer.current !== null) {
        window.clearTimeout(syncTimer.current)
      }
    }
  }, [])

  const value = useMemo(
    () => ({
      experiences,
      activeIndex,
      goToExperience,
      setHeroTrackEl,
      setScheduleTrackEl,
    }),
    [experiences, activeIndex, goToExperience],
  )

  return (
    <ExperienceHomeContext.Provider value={value}>
      {children}
    </ExperienceHomeContext.Provider>
  )
}

export function useExperienceHome() {
  const ctx = useContext(ExperienceHomeContext)
  if (!ctx) {
    throw new Error("useExperienceHome must be used within ExperienceHomeProvider")
  }
  return ctx
}
