import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function AdminMembersPage() {
  return (
    <PortalPlaceholder
      eyebrow="회원관리"
      title="일반회원"
      description="일반회원(수강생) 목록 조회·검색·상세 및 계정 관리."
      items={["회원 목록 · 예약/결제 이력", "계정 상태 관리"]}
    />
  )
}
