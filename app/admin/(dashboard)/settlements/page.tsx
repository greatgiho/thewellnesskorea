import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function AdminSettlementsPage() {
  return (
    <PortalPlaceholder
      eyebrow="결제 · 정산"
      title="정산 승인"
      description="파트너(강사/공연팀)의 정산 요청을 검토하고 지급을 승인하는 백오피스 화면."
      items={[
        "정산 대상·금액 검토 (매출 − 수수료 − 제세공과금)",
        "지급 승인 / 지급 일자 기록",
      ]}
    />
  )
}
