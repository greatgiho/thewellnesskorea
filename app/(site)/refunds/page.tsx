import type { Metadata } from "next"
import { LegalPageLayout, LegalSection } from "@/components/legal/legal-page-layout"
import {
  PLACEHOLDER_SITE_INFO,
  resolveSiteSettings,
} from "@/lib/site/settings-source"
import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_UPDATED_EN,
  REFUND_STEPS,
} from "@/lib/legal/refund"

export const metadata: Metadata = {
  title: "취소·환불규정 — The Wellness Korea",
  description:
    "브릭웰 서촌 팝업의 데이 리트릿, 클래스, 전시 티켓에 적용되는 취소 및 환불 기준입니다.",
}

/**
 * The page that did not exist, and whose absence is why the payment
 * application was refused.
 *
 * In Korean and unabridged. The terms used to defer this — "취소·환불규정을
 * 별도로 정한다" — in the future tense, on a site already taking bookings,
 * which is the same as having no policy at all.
 *
 * The trader block at the bottom comes from site_settings, so a registration
 * number corrected in the admin is corrected here too. The alternative is a
 * legal page quoting a number nobody has kept up.
 */
export default async function RefundsPage() {
  const { site, business } = await resolveSiteSettings()
  const contactEmail = site.contactEmail || PLACEHOLDER_SITE_INFO.contactEmail

  return (
    <LegalPageLayout title="취소·환불규정" updated={LEGAL_UPDATED_EN}>
      <p className="text-muted-foreground">
        브릭웰 서촌 팝업의 데이 리트릿, 이브닝 프로그램, 개별 클래스 및 전시
        관람 티켓에 적용되며, 이용약관의 일부를 구성합니다. 공정거래위원회 고시
        「소비자분쟁해결기준」의 공연업 기준을 따릅니다.
      </p>

      <LegalSection title="제1조 (적용 범위 및 우선순위)">
        <p>① 이 규정은 위 상품의 취소와 환불에 적용되며, 이용약관의 일부를 구성합니다.</p>
        <p>② 이 규정은 공정거래위원회 고시 「소비자분쟁해결기준」의 공연업 기준을 따릅니다.</p>
        <p>
          ③ 이 규정이 「전자상거래 등에서의 소비자보호에 관한 법률」 등 관련
          법령보다 이용자에게 불리한 경우에는 관련 법령이 우선하여 적용됩니다.
        </p>
        <p>
          ④ 중개 프로그램의 환불 의무는 판매자에게 있으며, 회사는 결제대금을 대신
          수령한 범위에서 판매자를 대신하여 환불 절차를 이행합니다.
        </p>
      </LegalSection>

      <LegalSection title="제2조 (청약철회)">
        <p>
          ① 이용자는 「전자상거래법」 제17조에 따라 결제일부터 7일 이내에 위약금
          또는 손해배상 없이 청약을 철회할 수 있습니다.
        </p>
        <p>
          ② 제1항에도 불구하고 청약철회 기간 내에 프로그램의 제공이 개시된
          경우에는 그 개시된 부분에 대하여 청약철회가 제한됩니다.
        </p>
        <p>③ 결제일부터 7일이 경과한 후의 취소에는 제3조의 기준이 적용됩니다.</p>
      </LegalSection>

      <LegalSection title="제3조 (이용자의 사정에 의한 취소)">
        <p>
          이용자가 본인의 사정으로 예약을 취소하는 경우, 취소 시점을 기준으로
          다음과 같이 환불합니다.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">취소 시점 (이용일 기준)</th>
                <th className="px-4 py-3 text-left font-normal">공제율</th>
                <th className="px-4 py-3 text-left font-normal">환불 금액</th>
              </tr>
            </thead>
            <tbody>
              {REFUND_STEPS.map((step, i) => (
                <tr
                  key={step.when}
                  className={i < REFUND_STEPS.length - 1 ? "border-b border-border/60" : ""}
                >
                  <td className="px-4 py-3 text-foreground">{step.when}</td>
                  <td className="px-4 py-3 text-muted-foreground">{step.deducted}</td>
                  <td className="px-4 py-3 text-muted-foreground">{step.refunded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm">
          ※ &ldquo;이용일 10일 전&rdquo;이란 이용일을 제외하고 역산하여 10일째
          되는 날의 24시까지를 의미합니다.
        </p>
        <p className="text-sm">
          ※ 취소 신청은 예약 시 안내된 온라인 취소 절차 또는 고객센터를 통해
          접수된 시각을 기준으로 합니다.
        </p>
      </LegalSection>

      <LegalSection title="제4조 (예약 후 24시간 이내 취소)">
        <p>
          이용일 3일 전까지 예약한 건에 한하여, 예약일시로부터 24시간 이내에
          취소하는 경우에는 제3조에도 불구하고 결제금액 전액을 환불합니다. 이 경우
          비영업일은 시간 계산에서 제외합니다.
        </p>
      </LegalSection>

      <LegalSection title="제5조 (지연 입장 및 미방문)">
        <p>
          ① 프로그램 시작 시각 이후 도착한 경우, 안전 및 진행상의 사유로 참여가
          제한될 수 있으며 이에 대하여는 환불하지 않습니다.
        </p>
        <p>② 사전 통지 없이 방문하지 아니한 경우(No-show)에는 환불하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="제6조 (부분 이용)">
        <p>
          데이 리트릿 등 복수의 세션으로 구성된 프로그램에 이용자가 개인 사정으로
          일부만 참여한 경우, 이미 제공된 용역에 대하여는 환불하지 않습니다. 다만
          회사 또는 판매자의 사정으로 일부 세션이 제공되지 아니한 경우에는
          제7조에 따릅니다.
        </p>
      </LegalSection>

      <LegalSection title="제7조 (회사 또는 판매자의 사정에 의한 취소 및 변경)">
        <p>
          ① 회사 또는 판매자의 귀책사유로 프로그램이 취소된 경우, 결제금액 전액을
          환불하고 결제금액의 10%를 배상합니다.
        </p>
        <p>
          ② 프로그램의 내용이 사전 안내와 현저히 다르게 제공된 경우(주요 진행자의
          교체, 예정된 프로그램 시간의 1/2 이하 진행 등)에는 결제금액 전액을
          환불하고 결제금액의 10%를 배상합니다.
        </p>
        <p>
          ③ 일정 변경으로 이용자가 참여할 수 없게 된 경우, 이용자는 위약금 없이
          전액 환불 또는 대체 일정 중 선택할 수 있습니다.
        </p>
        <p>
          ④ 천재지변, 감염병 확산에 따른 정부 조치 등 불가항력으로 프로그램이
          취소된 경우에는 위약금 및 배상 없이 결제금액 전액을 환불하거나 대체
          일정을 제공합니다.
        </p>
      </LegalSection>

      <LegalSection title="제8조 (전시 관람 티켓)">
        <p>
          전시 관람 티켓은 운영기간 내 일자 미지정 방식으로 판매되며, 다음 기준에
          따릅니다.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">구분</th>
                <th className="px-4 py-3 text-left font-normal">환불 기준</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["미사용 · 운영기간 종료 전", "결제금액 100% 환불"],
                ["미사용 · 운영기간 종료 후", "환불 불가"],
                ["입장(QR 사용) 이후", "환불 불가"],
                ["회사 사정에 의한 휴관", "전액 환불 또는 유효기간 연장"],
              ].map(([label, rule], i, all) => (
                <tr
                  key={label}
                  className={i < all.length - 1 ? "border-b border-border/60" : ""}
                >
                  <td className="px-4 py-3 text-foreground">{label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{rule}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="제9조 (도예 작품 관련)">
        <p>
          ① 도예 체험이 포함된 프로그램을 이용한 후에는 작품의 인도 여부와 관계없이
          프로그램 대금이 환불되지 않습니다.
        </p>
        <p>
          ② 소성 과정에서 작품이 파손되어 인도가 불가능한 경우, 판매자는 재제작
          기회 제공 또는 작품 제작 상당액의 부분 환불 중 이용자와 협의한 조치를
          이행합니다.
        </p>
      </LegalSection>

      <LegalSection title="제10조 (환불의 방법 및 기간)">
        <p>① 환불은 원칙적으로 결제한 수단과 동일한 수단으로 처리합니다.</p>
        <p>
          ② 회사는 취소 접수일부터 3영업일 이내에 환불을 처리하며, 카드 결제의
          경우 카드사의 처리 일정에 따라 실제 입금까지 추가로 3~7영업일이 소요될
          수 있습니다.
        </p>
        <p>
          ③ 결제 수단과 동일한 방법으로 환불이 불가능한 경우에는 이용자가 지정한
          계좌로 환불하며, 이 경우 회사는 예금주 확인 등에 필요한 정보를 요청할 수
          있습니다.
        </p>
        <p>
          ④ 해외 발행 카드 및 외화 결제 건의 환불 시, 환율 변동에 따른 차액 및
          카드사 수수료에 대하여는 회사가 책임을 지지 않습니다.
        </p>
      </LegalSection>

      <LegalSection title="제11조 (문의)">
        <p>취소 및 환불에 관한 문의는 아래로 연락하시기 바랍니다.</p>
        <p>
          이메일 {contactEmail}
          {business.phone ? ` · 전화 ${business.phone}` : null}
        </p>
      </LegalSection>

      <LegalSection title="부칙">
        <p>이 규정은 {LEGAL_EFFECTIVE_DATE}부터 시행합니다.</p>
      </LegalSection>
    </LegalPageLayout>
  )
}
