export type Level = "Beginner" | "Intermediate" | "All Levels"

export type Category =
  | "Hatha"
  | "Vinyasa"
  | "Yin Yoga"
  | "Sound Healing"
  | "Meditation"

export type ClassItem = {
  id: string
  start: string
  end: string
  duration: string
  title: string
  category: Category
  level: Level
  teacher: string
  initials: string
  spots: number
  period: "AM" | "PM"
}

export type WeekDay = {
  key: string
  name: string
  date: number
  isToday: boolean
}
