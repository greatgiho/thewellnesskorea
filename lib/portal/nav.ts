import type { PortalNavGroup } from "@/components/portal/portal-sidebar"

// 대표(CEO) 요구 기반 메뉴 스켈레톤. `status: "skeleton"` = 아직 더미 페이지.
// status 없는 항목 = 이미 구현된 기존 화면으로 연결.

export const ADMIN_NAV: PortalNavGroup[] = [
  { items: [{ label: "Dashboard", href: "/admin" }] },
  {
    title: "회원관리",
    items: [
      { label: "일반회원", href: "/admin/members", status: "skeleton" },
      { label: "파트너", href: "/admin/partners" },
    ],
  },
  {
    title: "결제 · 정산",
    items: [
      { label: "결제", href: "/admin/bookings" },
      { label: "정산 승인", href: "/admin/settlements", status: "skeleton" },
    ],
  },
  {
    title: "운영 (구현됨)",
    items: [
      { label: "스케줄", href: "/admin/schedule" },
      { label: "저널", href: "/admin/journal" },
      { label: "대기자", href: "/admin/waitlist" },
    ],
  },
]

export const PARTNER_NAV: PortalNavGroup[] = [
  { items: [{ label: "Dashboard", href: "/partner" }] },
  {
    title: "Class Instructor",
    items: [
      { label: "정산 관리", href: "/partner/settlement", status: "skeleton" },
      { label: "수강생 관리", href: "/partner/students", status: "skeleton" },
      { label: "커뮤니티", href: "/partner/community", status: "skeleton" },
    ],
  },
  {
    title: "Performance Team",
    items: [
      { label: "공연 관리", href: "/partner/performances", status: "skeleton" },
      {
        label: "정산 관리",
        href: "/partner/performance-settlement",
        status: "skeleton",
      },
      {
        label: "관람객 · 커뮤니티",
        href: "/partner/performance-community",
        status: "skeleton",
      },
    ],
  },
  {
    title: "내 클래스 (구현됨)",
    items: [
      { label: "수업 이력", href: "/partner/history" },
      { label: "내 프로필", href: "/partner/profile" },
    ],
  },
]
