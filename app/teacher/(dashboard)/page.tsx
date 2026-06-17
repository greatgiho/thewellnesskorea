import { TeacherUpcomingSchedule } from "@/components/teacher/teacher-upcoming-schedule"
import { getUpcomingSessionsForTeacher } from "@/lib/schedule/teacher-queries"

export default async function TeacherDashboardPage() {
  const sessions = await getUpcomingSessionsForTeacher()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">
          Upcoming Schedule
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          확정·발행된 예정 수업입니다.
        </p>
      </div>
      <TeacherUpcomingSchedule sessions={sessions} />
    </div>
  )
}
