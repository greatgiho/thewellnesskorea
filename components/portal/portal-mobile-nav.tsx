"use client"

import { useEffect, useState } from "react"
import { useBodyScrollLock } from "@/lib/ui/use-body-scroll-lock"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import {
  PortalSidebar,
  type PortalNavGroup,
} from "@/components/portal/portal-sidebar"

/**
 * 모바일 포털 내비게이션: 햄버거 + 전체화면 드로어.
 *
 * 데스크톱 사이드바(240px)는 390px 화면에서 본문에 150px밖에 남기지 않아
 * 사실상 사용할 수 없었다. `md` 미만에서는 사이드바를 감추고 이 드로어로 대체한다.
 * 공개 사이트 `Navbar`와 같은 패턴(스크롤 잠금, 라우트 이동 시 닫힘).
 */
export function PortalMobileNav({
  brand,
  groups,
  roots,
}: {
  brand: string
  groups: PortalNavGroup[]
  roots: string[]
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // 드로어 안의 링크는 PortalSidebar가 렌더하므로 onClick을 걸 수 없다.
  // 경로가 바뀌면 닫는 것으로 대신한다.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useBodyScrollLock(open)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-ml-1 shrink-0 rounded-lg p-2 text-foreground transition-colors hover:bg-muted md:hidden"
        aria-label="메뉴 열기"
      >
        <Menu className="size-5" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="메뉴 닫기"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85%] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-end border-b border-border px-2 py-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-foreground transition-colors hover:bg-muted"
                aria-label="메뉴 닫기"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PortalSidebar brand={brand} groups={groups} roots={roots} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
