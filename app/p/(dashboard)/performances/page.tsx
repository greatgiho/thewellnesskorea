import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function PartnerPerformancesPage() {
  return (
    <PortalPlaceholder
      eyebrow="Performance Team"
      title="공연 관리"
      description="공연팀이 직접 공연을 기획·개설하고 관리."
      items={[
        "공연 개설 폼(직접 오픈)",
        "공연 일자·시간대 설정 + 회차별 참가자(관람객) 수 제한",
      ]}
    />
  )
}
