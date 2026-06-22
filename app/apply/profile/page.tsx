import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { linkTeacherPartner } from "@/lib/apply/teacher-partner"
import { getPartnerById } from "@/lib/partners/queries"
import { getRegionsForForms } from "@/lib/regions/queries"
import { TeacherProfileForm } from "@/components/apply/teacher-profile-form"

export default async function ApplyProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/apply")

  let linkError: string | null = null
  let personRow = null
  try {
    personRow = await linkTeacherPartner(supabase, user)
  } catch (err) {
    linkError = err instanceof Error ? err.message : "Failed to load profile."
  }

  const person = personRow ? await getPartnerById(personRow.id) : null
  const regions = await getRegionsForForms()

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-8">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            The Wellness Korea
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light text-foreground">
            프로필 {person ? "수정" : "등록"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            로그인: {user.email}
          </p>
        </div>

        {linkError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {linkError}
          </p>
        ) : (
          <TeacherProfileForm
            person={person}
            loginEmail={user.email ?? ""}
            regions={regions}
          />
        )}
      </div>
    </div>
  )
}
