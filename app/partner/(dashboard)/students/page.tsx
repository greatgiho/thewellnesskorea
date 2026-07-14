import { PortalPlaceholder } from "@/components/portal/portal-placeholder"

export default function PartnerStudentsPage() {
  return (
    <PortalPlaceholder
      eyebrow="Class Instructor"
      title="수강생 관리"
      description="개별 수업의 수강생 리스트를 조회하고 수강 문의에 답변."
      items={["수업별 수강생 명단 조회", "수강 문의(Q&A) 응대"]}
    />
  )
}
