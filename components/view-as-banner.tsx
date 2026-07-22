import { exitViewAs } from "@/app/a/view-as-actions"
import { getViewAs } from "@/lib/view-as-server"
import { createServiceClient } from "@/lib/supabase/service"

/**
 * Sticky banner shown across a portal while an admin is in read-only view-as.
 * Renders nothing when not impersonating.
 */
export async function ViewAsBanner() {
  const viewAs = await getViewAs()
  if (!viewAs) return null

  const service = createServiceClient()
  let label = viewAs.id
  if (viewAs.kind === "partner") {
    const { data } = await service
      .from("partners")
      .select("*")
      .eq("id", viewAs.id)
      .maybeSingle()
    const row = (data ?? {}) as Record<string, unknown>
    label =
      (row.name_ko as string) ||
      (row.name_en as string) ||
      (row.name as string) ||
      (row.slug as string) ||
      viewAs.id
  } else {
    const { data } = await service.auth.admin.getUserById(viewAs.id)
    label = data?.user?.email ?? viewAs.id
  }

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900">
      <span>
        👁 <strong>{label}</strong>
        {viewAs.kind === "partner" ? " 파트너" : " 회원"}로 보는 중 · 읽기 전용
        (관리자 view-as)
      </span>
      <form action={exitViewAs}>
        <button
          type="submit"
          className="rounded-full border border-amber-600/40 px-3 py-1 text-xs font-medium text-amber-900 transition-colors hover:bg-amber-500/20"
        >
          View-as 종료
        </button>
      </form>
    </div>
  )
}
