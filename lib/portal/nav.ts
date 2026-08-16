import type { PortalNavGroup } from "@/components/portal/portal-sidebar"

// 대표(CEO) 요구 기반 메뉴 스켈레톤. `status: "skeleton"` = 아직 더미 페이지.
// status 없는 항목 = 이미 구현된 기존 화면으로 연결.

export const ADMIN_NAV: PortalNavGroup[] = [
  { items: [{ label: "Dashboard", href: "/a" }] },
  {
    title: "회원관리",
    items: [
      { label: "일반회원", href: "/a/members" },
      { label: "파트너", href: "/a/partners" },
    ],
  },
  {
    title: "결제 · 정산",
    items: [
      { label: "결제", href: "/a/bookings" },
      { label: "쿠폰", href: "/a/coupons" },
      // Under 결제·정산 rather than 운영: what it is for is working out who
      // gets paid, not running the day.
      { label: "레퍼럴", href: "/a/referrals" },
      { label: "정산 승인", href: "/a/settlements", status: "skeleton" },
    ],
  },
  {
    title: "운영 (구현됨)",
    items: [
      { label: "스케줄", href: "/a/schedule" },
      { label: "저널", href: "/a/journal" },
      { label: "대기자", href: "/a/waitlist" },
    ],
  },
  // Last, and untitled: it is about the person signed in, not about the
  // business, so it does not belong under any of the groups above.
  { items: [{ label: "설정", href: "/a/settings" }] },
]

export const PARTNER_NAV: PortalNavGroup[] = [
  { items: [{ label: "Dashboard", href: "/p" }] },
  {
    title: "Class Instructor",
    items: [
      { label: "정산 관리", href: "/p/settlement", status: "skeleton" },
      { label: "수강생 관리", href: "/p/students" },
      { label: "커뮤니티", href: "/p/community", status: "skeleton" },
    ],
  },
  {
    title: "Performance Team",
    items: [
      { label: "공연 관리", href: "/p/performances", status: "skeleton" },
      {
        label: "정산 관리",
        href: "/p/performance-settlement",
        status: "skeleton",
      },
      {
        label: "관람객 · 커뮤니티",
        href: "/p/performance-community",
        status: "skeleton",
      },
    ],
  },
  {
    title: "내 클래스 (구현됨)",
    items: [
      { label: "수업 이력", href: "/p/history" },
      { label: "내 프로필", href: "/p/profile" },
    ],
  },
]
