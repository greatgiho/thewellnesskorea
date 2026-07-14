import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function PartnerPerformanceCommunityPage() {
  return (
    <PortalPlaceholder
      eyebrow="Performance Team · Lock-in"
      title="관람객 · 커뮤니티"
      description="개별 공연의 관람객 명단 조회 및 관람 문의/CS 응대 + 공연팀 전용 커뮤니티."
      items={[
        "공연별 관람객 명단 · 관람 문의/CS",
        "공연팀 전용 소통 게시판 (타 공연 홍보·자체 공지 등 자율성 높은 공간)",
      ]}
    />
  )
}
