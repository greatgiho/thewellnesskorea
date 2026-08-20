import type { Metadata } from "next"
import { LegalPageLayout, LegalSection } from "@/components/legal/legal-page-layout"
import {
  PLACEHOLDER_SITE_INFO,
  resolveSiteSettings,
} from "@/lib/site/settings-source"
import { LEGAL_EFFECTIVE_DATE, LEGAL_UPDATED_EN } from "@/lib/legal/refund"

export const metadata: Metadata = {
  title: "개인정보처리방침 — The Wellness Korea",
  description:
    "더 웰니스코리아가 처리하는 개인정보의 목적, 항목, 보유기간, 제3자 제공, 위탁 및 국외이전에 관한 방침입니다.",
}

/**
 * The privacy policy, in Korean and in full.
 *
 * Two articles of the source document are deliberately absent, because
 * publishing a policy that describes processing we do not do is itself a
 * breach — the document says so about itself. 행태정보 is gone: there is no
 * analytics and no ad pixel in this codebase. 영상정보처리기기 is gone: there
 * is no CCTV at Brickwell. Both were confirmed before removal, and the
 * articles after them are renumbered rather than left with holes.
 *
 * The processor and cross-border tables name what the code actually talks to.
 * Supabase is not in the cross-border table on purpose: the project runs in
 * ap-northeast-2, so that data does not leave Korea.
 */
export default async function PrivacyPage() {
  const { site, business } = await resolveSiteSettings()
  const contactEmail = site.contactEmail || PLACEHOLDER_SITE_INFO.contactEmail

  return (
    <LegalPageLayout title="개인정보처리방침" updated={LEGAL_UPDATED_EN}>
      <p className="text-muted-foreground">
        더 웰니스코리아(이하 &ldquo;회사&rdquo;)는 「개인정보 보호법」 제30조에
        따라 정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게
        처리할 수 있도록 하기 위하여 다음과 같이 개인정보처리방침을
        수립·공개합니다.
      </p>

      <LegalSection title="제1조 (개인정보의 처리 목적)">
        <p>
          회사는 다음의 목적을 위하여 개인정보를 처리하며, 처리한 개인정보는 해당
          목적 이외의 용도로는 이용하지 않습니다. 이용 목적이 변경되는 경우에는
          「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를
          이행합니다.
        </p>
        <p>
          1. 회원 가입 및 관리: 본인 식별·인증, 회원자격 유지·관리, 부정이용 방지,
          각종 고지·통지, 고충처리
        </p>
        <p>
          2. 예약 및 결제: 프로그램·클래스·전시 티켓의 예약 접수 및 확인, 대금
          결제, 취소 및 환불, 본인 확인
        </p>
        <p>
          3. 재화 및 용역의 제공: 프로그램 운영, 작품의 제작 및 인도, 안전한
          프로그램 진행을 위한 건강·식이 관련 사항의 확인
        </p>
        <p>
          4. 통신판매중개: 판매자에게 프로그램 운영에 필요한 최소한의 참가자 정보
          전달
        </p>
        <p>
          5. 마케팅 및 광고에의 활용: 신규 서비스 개발, 이벤트 및 광고성 정보
          제공(동의한 경우에 한함), 서비스 이용 통계 및 분석
        </p>
        <p>
          6. 민원사무 처리: 민원인의 신원 확인, 민원사항 확인, 사실조사를 위한
          연락·통지, 처리결과 통보
        </p>
      </LegalSection>

      <LegalSection title="제2조 (처리하는 개인정보의 항목)">
        <p>회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">구분</th>
                <th className="px-4 py-3 text-left font-normal">필수항목</th>
                <th className="px-4 py-3 text-left font-normal">선택항목</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["회원가입", "이름, 아이디(이메일), 비밀번호, 휴대전화번호", "생년월일, 성별, 국적, 사용 언어"],
                ["소셜 로그인", "소셜 계정 식별자, 이름, 이메일", "프로필 이미지"],
                ["예약·결제", "이름, 연락처, 이메일, 결제정보(결제수단 종류, 승인번호), 예약 상품 및 일시", "동반자 정보"],
                ["프로그램 참여", "건강 관련 고지사항(알레르기, 식이 제한, 신체적 제약), 촬영 동의 여부", "요청사항"],
                ["작품 배송", "수령인 이름, 주소, 연락처", "—"],
                ["뉴스레터", "이메일, 이름", "관심 분야"],
                ["문의·민원", "이름, 연락처, 이메일, 문의 내용", "—"],
                ["자동 생성", "IP 주소, 쿠키, 서비스 이용기록, 접속 로그, 기기정보, 브라우저 정보", "—"],
              ].map(([kind, required, optional], i, all) => (
                <tr key={kind} className={i < all.length - 1 ? "border-b border-border/60" : ""}>
                  <td className="px-4 py-3 align-top text-foreground">{kind}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{required}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{optional}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          회사는 사상·신념, 정치적 견해, 건강 및 성생활 등에 관한 민감정보를
          원칙적으로 처리하지 않습니다. 다만 프로그램 참여자의 안전 확보를 위하여
          필요한 최소한의 건강 관련 정보는 정보주체의 별도 동의를 받아 처리하며,
          해당 프로그램 종료 후 지체 없이 파기합니다.
        </p>
        <p>회사는 주민등록번호를 처리하지 않습니다.</p>
      </LegalSection>

      <LegalSection title="제3조 (개인정보의 처리 및 보유 기간)">
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">구분</th>
                <th className="px-4 py-3 text-left font-normal">보유 기간</th>
                <th className="px-4 py-3 text-left font-normal">근거</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["회원 정보", "회원 탈퇴 시까지", "동의"],
                ["1년 이상 미이용 회원 정보", "분리 보관 후 파기", "내부 방침"],
                ["건강 관련 고지사항", "해당 프로그램 종료 후 즉시 파기", "동의"],
                ["계약 또는 청약철회 등에 관한 기록", "5년", "전자상거래법"],
                ["대금결제 및 재화 등의 공급에 관한 기록", "5년", "전자상거래법"],
                ["소비자의 불만 또는 분쟁처리에 관한 기록", "3년", "전자상거래법"],
                ["표시·광고에 관한 기록", "6개월", "전자상거래법"],
                ["웹사이트 방문 기록(접속 로그)", "3개월", "통신비밀보호법"],
                ["전자금융 거래에 관한 기록", "5년", "전자금융거래법"],
              ].map(([kind, period, basis], i, all) => (
                <tr key={kind} className={i < all.length - 1 ? "border-b border-border/60" : ""}>
                  <td className="px-4 py-3 align-top text-foreground">{kind}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{period}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LegalSection>

      <LegalSection title="제4조 (개인정보의 제3자 제공)">
        <p>
          ① 회사는 정보주체의 개인정보를 제1조에서 명시한 범위 내에서만 처리하며,
          정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및
          제18조에 해당하는 경우에만 제3자에게 제공합니다.
        </p>
        <p>
          ② 회사는 통신판매중개자로서 프로그램 판매자(명장, 강사, 아티스트, 파트너
          사업자 등)에게 예약된 프로그램의 진행, 참가자 확인, 안전관리, 작품 제작 및
          인도를 목적으로 이름, 연락처, 예약 내역, 건강·식이 고지사항을 제공하며,
          프로그램 종료 및 작품 인도 완료 후 지체 없이 파기하도록 합니다.
        </p>
        <p>
          ③ 정보주체는 제2항의 제3자 제공에 동의하지 않을 권리가 있습니다. 다만
          동의하지 않는 경우 해당 프로그램의 예약 및 안전한 진행이 제한될 수
          있습니다.
        </p>
        <p>
          ④ 개별 프로그램의 구체적인 판매자 정보는 각 상품 페이지 및 예약 절차에서
          사전에 안내합니다.
        </p>
      </LegalSection>

      <LegalSection title="제5조 (개인정보 처리업무의 위탁)">
        <p>
          ① 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보
          처리업무를 위탁하고 있습니다.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">수탁자</th>
                <th className="px-4 py-3 text-left font-normal">위탁업무의 내용</th>
                <th className="px-4 py-3 text-left font-normal">보유·이용 기간</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["PayPal", "해외 발행 카드 결제 처리, 결제 취소 및 환불", "위탁계약 종료 시까지"],
                ["토스페이먼츠", "국내 결제 처리, 결제 취소 및 환불", "위탁계약 종료 시까지"],
                ["Supabase", "데이터베이스 운영 및 데이터 보관 (서울 리전)", "위탁계약 종료 시까지"],
                ["Vercel", "웹사이트 호스팅 및 서비스 운영", "위탁계약 종료 시까지"],
                ["Brevo", "예약 확인 및 안내 메일, 뉴스레터 발송", "위탁계약 종료 시까지"],
              ].map(([who, what, period], i, all) => (
                <tr key={who} className={i < all.length - 1 ? "border-b border-border/60" : ""}>
                  <td className="px-4 py-3 align-top text-foreground">{who}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{what}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          ② 회사는 위탁계약 체결 시 「개인정보 보호법」 제26조에 따라 위탁업무
          수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한,
          수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에
          명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독합니다.
        </p>
        <p>
          ③ 위탁업무의 내용이나 수탁자가 변경될 경우 지체 없이 이 개인정보처리방침을
          통하여 공개합니다.
        </p>
      </LegalSection>

      <LegalSection title="제6조 (개인정보의 국외 이전)">
        <p>
          ① 회사는 서비스 제공을 위하여 다음과 같이 개인정보를 국외로 이전하고
          있습니다. 이는 「개인정보 보호법」 제28조의8 제1항 제3호에 따라
          정보주체와의 계약의 체결 및 이행을 위하여 필요한 처리위탁·보관에
          해당하며, 같은 조에 따라 그 사항을 이 처리방침에 공개합니다.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left font-normal">이전받는 자</th>
                <th className="px-4 py-3 text-left font-normal">국가 · 방법</th>
                <th className="px-4 py-3 text-left font-normal">이전 항목</th>
                <th className="px-4 py-3 text-left font-normal">목적 · 보유기간</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["PayPal", "미국 · 결제 시점에 네트워크를 통한 전송", "이름, 이메일, 결제정보", "해외 발행 카드 결제 처리 / 관련 법령이 정한 기간"],
                ["Vercel", "미국 · 서비스 이용 시점에 네트워크를 통한 전송", "접속 로그, IP 주소", "웹사이트 호스팅 / 위탁계약 종료 시까지"],
                ["Brevo", "프랑스 · 발송 시점에 네트워크를 통한 전송", "이름, 이메일", "안내 메일 및 뉴스레터 발송 / 수신동의 철회 시까지"],
              ].map(([who, how, items, purpose], i, all) => (
                <tr key={who} className={i < all.length - 1 ? "border-b border-border/60" : ""}>
                  <td className="px-4 py-3 align-top text-foreground">{who}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{how}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{items}</td>
                  <td className="px-4 py-3 align-top text-muted-foreground">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          회사의 데이터베이스는 대한민국(서울) 리전에서 운영되며, 예약 및 회원
          정보는 국외로 이전되지 않습니다.
        </p>
        <p>
          ② 정보주체는 개인정보의 국외 이전을 거부할 수 있습니다. 거부를 원하는
          정보주체는 제12조의 개인정보 보호책임자에게 연락하여 요청할 수 있습니다.
        </p>
        <p>
          ③ 국외 이전을 거부하는 경우 해외 발행 카드 결제, 뉴스레터 수신 등 해당
          이전이 필요한 서비스의 전부 또는 일부를 이용할 수 없습니다.
        </p>
      </LegalSection>

      <LegalSection title="제7조 (개인정보의 파기)">
        <p>
          ① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가
          불필요하게 되었을 때에는 지체 없이(보유기간 경과 또는 목적 달성일로부터
          5일 이내) 해당 개인정보를 파기합니다.
        </p>
        <p>
          ② 정보주체로부터 동의받은 보유기간이 경과하거나 처리목적이 달성되었음에도
          다른 법령에 따라 개인정보를 계속 보존하여야 하는 경우에는, 해당 개인정보를
          별도의 데이터베이스로 옮기거나 보관장소를 달리하여 보존합니다.
        </p>
        <p>
          ③ 파기의 방법: 전자적 파일은 복원이 불가능한 방법으로 영구 삭제하고, 종이
          문서는 분쇄하거나 소각합니다.
        </p>
      </LegalSection>

      <LegalSection title="제8조 (정보주체와 법정대리인의 권리·의무 및 행사방법)">
        <p>
          ① 정보주체는 회사에 대하여 언제든지 개인정보 열람, 정정, 삭제, 처리정지를
          요구하거나 처리에 대한 동의를 철회할 수 있습니다.
        </p>
        <p>
          ② 제1항에 따른 권리 행사는 서비스 내 개인정보 관리화면, 전자우편, 서면 등을
          통하여 할 수 있으며, 회사는 이에 대하여 지체 없이(요구를 받은 날부터 10일
          이내) 조치합니다.
        </p>
        <p>
          ③ 정보주체가 개인정보의 오류 등에 대한 정정 또는 삭제를 요구한 경우, 회사는
          정정 또는 삭제를 완료할 때까지 해당 개인정보를 이용하거나 제공하지 않습니다.
        </p>
        <p>
          ④ 제1항에 따른 권리 행사는 정보주체의 법정대리인이나 위임을 받은 자 등
          대리인을 통하여 할 수 있습니다. 이 경우 「개인정보 처리 방법에 관한 고시」
          별지 제11호 서식에 따른 위임장을 제출하여야 합니다.
        </p>
        <p>
          ⑤ 개인정보 열람 및 처리정지 요구는 「개인정보 보호법」 제35조 제4항 및
          제37조 제2항에 의하여 정보주체의 권리가 제한될 수 있습니다.
        </p>
        <p>
          ⑥ 다른 법령에서 그 개인정보가 수집 대상으로 명시되어 있는 경우에는 삭제를
          요구할 수 없습니다.
        </p>
        <p>⑦ 회사는 권리 행사를 요구한 자가 본인이거나 정당한 대리인인지를 확인합니다.</p>
      </LegalSection>

      <LegalSection title="제9조 (만 14세 미만 아동의 개인정보 처리)">
        <p>
          ① 회사는 만 14세 미만 아동의 개인정보를 처리하기 위하여 동의가 필요한
          경우 법정대리인의 동의를 받습니다.
        </p>
        <p>
          ② 회사는 법정대리인의 동의를 확인하기 위하여 필요한 최소한의 정보(법정
          대리인의 성명 및 연락처)를 아동으로부터 직접 수집할 수 있습니다.
        </p>
        <p>
          ③ 법정대리인은 아동의 개인정보에 대한 열람, 정정, 삭제 및 처리정지를
          요구할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제10조 (개인정보의 안전성 확보조치)">
        <p>1. 관리적 조치: 내부관리계획의 수립 및 시행, 개인정보 취급 담당자의 최소화 및 정기적 교육</p>
        <p>
          2. 기술적 조치: 개인정보처리시스템에 대한 접근권한 관리, 접속기록의 보관 및
          위·변조 방지, 고유식별정보 및 비밀번호의 암호화, 보안프로그램 설치 및 갱신
        </p>
        <p>3. 물리적 조치: 전산실 및 자료보관실 등에 대한 접근통제</p>
        <p>
          4. 개인정보의 암호화: 비밀번호는 일방향 암호화하여 저장하며, 전송 구간은
          SSL/TLS로 암호화합니다.
        </p>
      </LegalSection>

      <LegalSection title="제11조 (개인정보 자동 수집 장치의 설치·운영 및 거부)">
        <p>
          ① 회사는 로그인 상태 유지 등 서비스 제공에 필요한 범위에서 쿠키(cookie)를
          사용합니다.
        </p>
        <p>
          ② 쿠키는 웹사이트를 운영하는 데 이용되는 서버가 이용자의 브라우저에 보내는
          소량의 정보이며 이용자 기기에 저장됩니다.
        </p>
        <p>
          ③ 이용자는 웹브라우저의 옵션 설정을 통하여 쿠키의 저장을 거부할 수
          있습니다. 다만 쿠키 저장을 거부하는 경우 로그인이 필요한 일부 서비스의
          이용에 어려움이 발생할 수 있습니다.
        </p>
        <p>
          ④ 회사는 맞춤형 광고를 집행하지 않으며, 광고 목적의 행태정보를 수집하지
          않습니다.
        </p>
      </LegalSection>

      <LegalSection title="제12조 (개인정보 보호책임자 및 열람청구)">
        <p>
          회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와
          관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보
          보호책임자를 지정하고 있습니다.
        </p>
        <p>
          개인정보 보호책임자: {business.privacyOfficer || "—"} · 이메일{" "}
          {contactEmail}
          {business.phone ? ` · 전화 ${business.phone}` : null}
        </p>
        <p>
          정보주체는 회사의 서비스를 이용하면서 발생한 모든 개인정보 보호 관련 문의,
          불만처리, 피해구제 등에 관한 사항을 개인정보 보호책임자에게 문의할 수
          있으며, 회사는 이에 대하여 지체 없이 답변 및 처리합니다.
        </p>
      </LegalSection>

      <LegalSection title="제13조 (개인정보 유출 등의 통지)">
        <p>
          ① 회사는 개인정보의 분실·도난·유출(이하 &ldquo;유출등&rdquo;) 사실을 알게
          되었을 때에는 지체 없이 해당 정보주체에게 유출등이 된 개인정보의 항목,
          시점과 경위, 피해 최소화를 위한 방법, 회사의 대응조치 및 피해구제절차, 신고
          접수 담당부서 및 연락처를 알립니다.
        </p>
        <p>
          ② 회사는 관련 법령이 정한 기준에 해당하는 경우 유출등을 알게 된 때부터
          72시간 이내에 개인정보보호위원회 또는 한국인터넷진흥원에 신고합니다.
        </p>
      </LegalSection>

      <LegalSection title="제14조 (정보주체의 권익침해에 대한 구제방법)">
        <p>
          정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁해결이나
          상담 등을 신청할 수 있습니다.
        </p>
        <p>개인정보분쟁조정위원회 — 1833-6972 · www.kopico.go.kr</p>
        <p>개인정보침해신고센터 — 118 · privacy.kisa.or.kr</p>
        <p>대검찰청 — 1301 · www.spo.go.kr</p>
        <p>경찰청 — 182 · ecrm.police.go.kr</p>
        <p>
          또한 「개인정보 보호법」 제35조(개인정보의 열람), 제36조(개인정보의
          정정·삭제), 제37조(개인정보의 처리정지 등)의 규정에 의한 요구에 대하여
          공공기관의 장이 행한 처분 또는 부작위로 인하여 권리 또는 이익의 침해를
          받은 자는 행정심판법이 정하는 바에 따라 행정심판을 청구할 수 있습니다.
        </p>
      </LegalSection>

      <LegalSection title="제15조 (개인정보처리방침의 변경)">
        <p>① 이 개인정보처리방침은 {LEGAL_EFFECTIVE_DATE}부터 적용됩니다.</p>
        <p>
          ② 회사가 이 방침을 변경하는 경우에는 변경사항의 시행 7일 전부터 홈페이지
          공지사항을 통하여 고지합니다. 다만 정보주체의 권리에 중대한 영향을 미치는
          변경의 경우에는 시행 30일 전부터 고지합니다.
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
