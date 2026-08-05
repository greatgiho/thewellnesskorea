import type { PathKey } from "@/lib/paths/paths-data"

export type Level = "Beginner" | "Intermediate" | "All Levels"

export type ClassItem = {
  id: string
  dateKey: string
  start: string
  end: string
  duration: string
  title: string
  categoryLabel: string
  pathKey: PathKey | null
  level: Level
  teacher: string
  initials: string
  spots: number
  period: "AM" | "PM"
  /** Booking has closed because the class already began. Decided on the server
   *  so it uses the same clock as getBookableSession; the card ships to the
   *  client, and a browser clock could disagree with the page it links to. */
  hasStarted: boolean
}

export type WeekDay = {
  key: string
  name: string
  date: number
  isToday: boolean
}
