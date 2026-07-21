import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function PartnerSettlementPage() {
  return (
    <PortalPlaceholder
      eyebrow="Class Instructor"
      title="정산 관리"
      description="내 수업(리트릿/개별)의 지급 예정·완료액과 지급 일자를 확인하는 정산 대시보드."
      items={[
        "리트릿 프로그램(3~6h): 플랫폼 고정 페이 — 개인별 지급 예정액 / 지급 완료액 / 지급 일자",
        "개별 수업: 커미션 — [전체 매출 − 수수료(10%) − 제세공과금] 실지급액을 기간별·수업별 조회",
      ]}
    />
  )
}
