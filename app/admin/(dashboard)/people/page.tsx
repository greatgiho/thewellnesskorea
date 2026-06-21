import { getAllPeopleAdmin } from "@/lib/people/queries"
import { AdminPeopleList } from "@/components/admin/admin-people-list"
import { applyLinkForTeachers } from "@/lib/notifications/admin-alerts"

export default async function AdminPeoplePage() {
  const people = await getAllPeopleAdmin()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">Partners</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wellness guides, artists, and brands
        </p>
      </div>
      <AdminPeopleList people={people} applyLink={applyLinkForTeachers()} />
    </div>
  )
}
