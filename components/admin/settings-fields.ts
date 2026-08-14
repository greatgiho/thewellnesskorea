import type { SettingsField } from "@/components/admin/settings-fields-form"

/**
 * What the settings page offers to edit, in the order it appears on the site.
 *
 * `hint` only where the value has a shape nobody remembers, or where what the
 * field does is not obvious from its label.
 */

export const SITE_INFO_FIELDS: SettingsField[] = [
  {
    column: "tagline_en",
    label: "소개 문구 (English)",
    hint: "로고 아래 한 문단.",
  },
  { column: "tagline_ko", label: "소개 문구 (한국어)" },
  {
    column: "visit_address_en",
    label: "찾아오는 길 (English)",
    hint: "줄을 나누면 그대로 줄이 나뉩니다.",
    multiline: true,
  },
  {
    column: "visit_address_ko",
    label: "찾아오는 길 (한국어)",
    multiline: true,
  },
  {
    column: "contact_email",
    label: "대표 이메일",
    hint: "하단과 개인정보처리방침·이용약관의 문의처에 함께 쓰입니다.",
  },
]

export const BUSINESS_INFO_FIELDS: SettingsField[] = [
  { column: "business_name", label: "상호" },
  { column: "representative_name", label: "대표자" },
  {
    column: "business_number",
    label: "사업자등록번호",
    hint: "000-00-00000",
  },
  {
    column: "mail_order_number",
    label: "통신판매업 신고번호",
    hint: "제0000-지역0000호",
  },
  { column: "address", label: "주소", hint: "사업자등록증상의 주소." },
  { column: "phone", label: "전화번호" },
  { column: "email", label: "이메일" },
  { column: "privacy_officer", label: "개인정보관리책임자" },
]
