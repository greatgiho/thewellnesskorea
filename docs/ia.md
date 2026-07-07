# Information Architecture

Last updated: 2026-07-07

Companion:
* [Site map & flows](./site-map-and-flows.md) (URL 트리)
* [Backend](./backend-architecture.md)
* [DB schema](./database-schema.md)

> IA = 콘텐츠/기능의 **구조·분류·내비게이션**(사용자 멘탈 모델). URL 목록은 sitemap(site-map-and-flows) 참조.

## 1. 접근 컨텍스트 (최상위 구분)

- **Visitor (공개)** — 브랜드·콘텐츠 탐색, 예약 시작
- **Member (회원/고객)** — 예약·내 계정
- **Partner (파트너)** — **관리자가 계정 발급**, 포털에서 내 클래스 확인 (셀프 등록 없음)
- **Admin (운영자)** — 콘텐츠·스케줄·예약·파트너 운영

### 인증·접근 경로 (각 컨텍스트 진입)

| 컨텍스트 | 진입/로그인 | 방식 |
|---|---|---|
| Visitor | 공개 | 인증 없음 |
| Member | `/login` · `/signup` | 매직링크 (passwordless) |
| Partner | `/partner/login` | 비밀번호 (계정은 **관리자가 발급**) |
| Admin | `/admin/login` | 비밀번호 |
| 공통 | `/auth/callback` | 매직링크 콜백 → 세션 |

- 한 이메일 = 한 역할 (member/partner/admin 겸직 불가, 이메일 충돌 가드).
- 상세 단계 플로우는 [site-map-and-flows](./site-map-and-flows.md) 참조.

## 2. 공개 사이트 IA (Visitor 멘탈 모델)

- **글로벌 내비게이션** (navbar)
  - Philosophy → 철학 섹션 (`/#philosophy`)
  - Wellness Guides → 가이드 섹션 (`/#guides`)
  - Artists → 아티스트 섹션 (`/#arts`)
  - Schedule → 스케줄 섹션 (`/#schedule`)
  - Journal → 저널 (별도 페이지 `/journal`)
- **홈 내러티브** (스크롤 순서)
  - Hero — Experience 캐러셀 (공간/경험별 가로 스와이프)
  - Philosophy — 브랜드 철학
  - Why Korea — K-웰니스 맥락
  - Five Paths — 다섯 갈래 (아래 분류 참조)
  - Guides — 발행된 가이드
  - Artists — 발행된 아티스트
  - Schedule — 경험별 클래스 일정
  - Closing CTA
- **푸터 내비게이션** (그룹)
  - The Approach — Philosophy · Why Korea · The Approach
  - Spaces — Brickwell · Seochon · Visit · Private Sessions
  - Explore — Five Paths · Wellness Guides · Artists · Schedule · Journal
  - Social — Instagram · Facebook · YouTube
  - Legal/Contact — Privacy · Terms · hello@thewellnesskorea.com

## 3. 콘텐츠 타입 & 관계

- **Experience / Venue (경험·공간)** — Brickwell(서촌) 등; 홈 Hero·Schedule의 단위
  - 하위: Sessions(일정), 소개 콘텐츠
- **Partner (파트너)** — 사람/브랜드 (관리자가 생성·관리)
  - 종류(kind): Guide · Artist · Brand (· both)
  - 분류: Five Paths 태그
  - 보유: Programs(프로그램), Sessions(강사로서)
- **Session (세션/클래스)** — Schedule의 단위
  - 소속: Venue·Floor, Instructor(Partner), Program
  - 상태: processing · confirmed · cancelled
  - 연결: Bookings, Waitlist, **세션 게시판(posts)**
- **Booking (예약)** — 세션에 대한 예약
  - 흐름 상태: 예약대기(pending_payment) · 확정 · 취소
  - 부속: Waitlist(대기), Payment(결제)
- **Journal (저널)** — 콘텐츠 글
  - 카테고리: Philosophy · Space · Programs · News · Local Discovery(region) · Local Taste(taste)
  - 연결: Partner 태그, Experience

## 4. 교차 분류 (Taxonomies)

- **Five Paths (철학 축)** — 파트너·프로그램·세션을 가로지르는 핵심 분류
  - 비움 Bium (Emptying)
  - 깨움 Kkaeum (Awakening)
  - 지음 Jieum (Crafting)
  - 채움 Chaeum (Nourishing)
  - 누림 Nurim (Savoring)
- **Partner kind** — Guide · Artist · Brand
- **Journal category** — Philosophy · Space · Programs · News · Local Discovery · Local Taste
- **상태 enum** — Session(processing/confirmed/cancelled) · Booking(pending_payment/확정/취소)

## 5. Member (회원) IA

- **인증** — `/login` · `/signup` (매직링크)
- **내 계정**
  - 계정 홈
  - 내 예약 목록
- **예약 태스크 흐름** (콘텐츠가 아닌 과업 경로)
  - 세션 선택 → (만석 시 대기 등록) → 결제 → 확정 → 관리/취소
  - 게스트 예약 후 같은 이메일로 가입 시 과거 예약 자동 연결

## 6. Partner (파트너) IA

- **접근** — 관리자가 파트너 계정 발급 → `/partner/login`(비밀번호). **셀프 등록(apply) 없음.**
- **포털** (`partner.thewellnesskorea.com` / `/partner`)
  - **예정 클래스** (대시보드 홈) — 앞으로 진행할 내 클래스
  - **내 프로필** — 조회 (수정은 관리자를 통해)
  - **수업 이력** — 완료된 클래스
  - **세션별**
    - 게시판 — 세션 posts(공지/노트)
    - 예약자 — 해당 세션 예약 명단

## 7. Admin (운영) IA

- **운영 내비게이션**
  - Partners — 목록 · 등록(계정 발급) · 상세/검토 · 편집
  - Schedule — 주/일/월 그리드, 세션 생성·확정·발행
  - Bookings — 세션별 예약 · 대기자
  - Waitlist — 대기자 개요
  - Journal — 글 목록 · 작성 · 편집
- **운영 대상 = §3 콘텐츠 타입의 CRUD/상태 전이 + 파트너 계정 발급**

## 8. IA ↔ Sitemap 차이 (요약)

- **Sitemap** = 존재하는 URL의 트리 (site-map-and-flows.md)
- **IA** = 위 콘텐츠를 *어떻게 묶고 분류하고 탐색하는가* — 접근/인증 경로, 글로벌 내비/푸터 그룹, 콘텐츠 타입 관계, 교차 분류(Five Paths 등)
