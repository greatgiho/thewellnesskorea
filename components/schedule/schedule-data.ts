import type { Category, ClassItem } from "./types"

export const CATEGORIES: ("All" | Category)[] = [
  "All",
  "Hatha",
  "Vinyasa",
  "Yin Yoga",
  "Sound Healing",
  "Meditation",
]

export const scheduleByDay: Record<string, ClassItem[]> = {
  0: [
    {
      id: "s1",
      start: "09:00",
      end: "10:15",
      duration: "75 min",
      title: "Slow Sunday Hatha",
      category: "Hatha",
      level: "All Levels",
      teacher: "Ji-woo Han",
      initials: "JH",
      spots: 8,
      period: "AM",
    },
    {
      id: "s2",
      start: "16:00",
      end: "17:00",
      duration: "60 min",
      title: "Sound Bath & Singing Bowls",
      category: "Sound Healing",
      level: "All Levels",
      teacher: "Mina Seo",
      initials: "MS",
      spots: 3,
      period: "PM",
    },
  ],
  default: [
    {
      id: "d1",
      start: "08:30",
      end: "09:45",
      duration: "75 min",
      title: "Morning Vinyasa Flow",
      category: "Vinyasa",
      level: "Intermediate",
      teacher: "Soo-ah Lim",
      initials: "SL",
      spots: 5,
      period: "AM",
    },
    {
      id: "d2",
      start: "10:30",
      end: "11:30",
      duration: "60 min",
      title: "Gentle Hatha Grounding",
      category: "Hatha",
      level: "Beginner",
      teacher: "Ji-woo Han",
      initials: "JH",
      spots: 12,
      period: "AM",
    },
    {
      id: "d3",
      start: "12:30",
      end: "13:15",
      duration: "45 min",
      title: "Midday Stillness Meditation",
      category: "Meditation",
      level: "All Levels",
      teacher: "Tae-yang Oh",
      initials: "TO",
      spots: 0,
      period: "PM",
    },
    {
      id: "d4",
      start: "17:30",
      end: "18:45",
      duration: "75 min",
      title: "Yin & Deep Release",
      category: "Yin Yoga",
      level: "All Levels",
      teacher: "Mina Seo",
      initials: "MS",
      spots: 6,
      period: "PM",
    },
    {
      id: "d5",
      start: "19:30",
      end: "20:30",
      duration: "60 min",
      title: "Evening Sound Healing",
      category: "Sound Healing",
      level: "All Levels",
      teacher: "Mina Seo",
      initials: "MS",
      spots: 2,
      period: "PM",
    },
  ],
}

export const categoryAccent: Record<Category, string> = {
  Hatha: "bg-[oklch(0.9_0.02_120)] text-primary",
  Vinyasa: "bg-[oklch(0.88_0.04_145)] text-primary",
  "Yin Yoga": "bg-[oklch(0.9_0.03_90)] text-[oklch(0.45_0.05_70)]",
  "Sound Healing": "bg-[oklch(0.9_0.025_60)] text-[oklch(0.45_0.06_55)]",
  Meditation: "bg-secondary text-primary",
}

export function buildWeek() {
  const days = []
  const today = new Date()
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      key: d.toISOString().slice(0, 10),
      name: dayNames[d.getDay()],
      date: d.getDate(),
      isToday: i === 0,
    })
  }
  return days
}

export function getClassesForDay(dayIndex: number): ClassItem[] {
  return scheduleByDay[dayIndex] ?? scheduleByDay.default
}
