import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function PartnerPerformanceSettlementPage() {
  return (
    <PortalPlaceholder
      eyebrow="Performance Team"
      title="정산 관리"
      description="공연 티켓 판매에 따른 전체 매출 및 커미션 정산 내역(수수료 공제 후 최종 금액) 확인."
      items={["티켓 매출 집계", "커미션 정산 내역 (수수료 공제 후 최종 지급액)"]}
    />
  )
}
