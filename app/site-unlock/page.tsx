import { redirect } from "next/navigation"
import { SiteUnlockForm } from "@/components/site-unlock-form"
import { isSiteAccessEnabled, safeNextPath } from "@/lib/site-access"

type SiteUnlockPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function SiteUnlockPage({ searchParams }: SiteUnlockPageProps) {
  if (!isSiteAccessEnabled()) redirect("/")

  const { next } = await searchParams
  const nextPath = safeNextPath(next)

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <p className="font-serif text-2xl text-foreground">The Wellness Korea</p>
          <h1 className="mt-2 text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Private preview
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            This site is not yet public. Enter the access password to continue.
          </p>
        </div>
        <SiteUnlockForm nextPath={nextPath} />
      </div>
    </div>
  )
}
