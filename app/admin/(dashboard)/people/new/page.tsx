import { PersonForm } from "@/components/admin/person-form"

export default function NewPersonPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-light text-foreground">New person</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a wellness guide or artist profile
        </p>
      </div>
      <PersonForm />
    </div>
  )
}
