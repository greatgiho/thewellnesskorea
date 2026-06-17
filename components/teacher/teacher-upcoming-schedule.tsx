"use client"

import { useState } from "react"
import type { SessionWithRelations } from "@/lib/schedule/types"
import { TeacherSessionCard } from "@/components/teacher/teacher-session-card"
import { TeacherSessionDetail } from "@/components/teacher/teacher-session-detail"

type TeacherUpcomingScheduleProps = {
  sessions: SessionWithRelations[]
}

export function TeacherUpcomingSchedule({
  sessions,
}: TeacherUpcomingScheduleProps) {
  const [selected, setSelected] = useState<SessionWithRelations | null>(null)

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
        <p className="font-serif text-lg text-foreground">예정된 수업이 없습니다</p>
        <p className="mt-2 text-sm text-muted-foreground">
          어드민에서 확정·발행된 수업만 표시됩니다.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {sessions.map((session) => (
          <TeacherSessionCard
            key={session.id}
            session={session}
            onClick={() => setSelected(session)}
          />
        ))}
      </div>
      <TeacherSessionDetail
        session={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
