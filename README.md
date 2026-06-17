# The Wellness Korea

웰니스 가이드/아티스트 소개와 클래스 스케줄을 운영하는 Next.js + Supabase 웹 애플리케이션.
공개 홈페이지, 강사 셀프 등록(매직링크), 강사 포털, 관리자 대시보드로 구성된다.

상세 설계 문서는 [`docs/`](#-문서)를 참고. 본 README는 빠른 온보딩·로컬 구동용 요약이다.

---

## 기술 스택

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 App Router (RSC + Server Actions) |
| Runtime / Lang | React 19 · TypeScript 5.7 |
| Styling | Tailwind CSS 4 (`cn()` = clsx + tailwind-merge) |
| UI | shadcn · @base-ui/react · lucide-react |
| Database | Supabase Postgres (전 테이블 RLS) |
| Auth | Supabase Auth — 관리자: 비밀번호 · 강사 등록: 매직링크 · 강사 포털: 비밀번호 |
| Storage | Supabase Storage (`person-photos`, `session-photos`) |
| Email | Resend (관리자 알림, 강사 계정 발급) |
| Alert | Slack incoming webhook (선택) |
| Deploy | Vercel · Gabia DNS · @vercel/analytics |

> CRUD는 별도 REST API 없이 **Server Actions**(`"use server"`)로 처리한다.

---

## 주요 기능

- **공개 홈페이지 (`/`)** — 발행된 가이드/아티스트 소개, 철학(paths), 스케줄(현재 mock 데이터)
- **강사 셀프 등록 (`/apply`)** — 초대코드 + 이메일 → 매직링크 → 프로필 작성/제출
- **강사 포털 (`/teacher`)** — 비밀번호 로그인, 본인의 확정·발행된 스케줄 조회, 비밀번호 변경
- **관리자 (`/admin`)** — 인물(people) CRUD·승인·발행, 스케줄(sessions) 관리, 계정 발급

역할 모델: `app_metadata.role`이 `teacher`면 강사, 그 외(미설정 포함)는 관리자.
권한은 미들웨어 가드 + Postgres RLS 이중으로 강제된다.

---

## 빠른 시작 (로컬)

```bash
# 1. 의존성 설치
npm install

# 2. 환경변수 설정
cp .env.local.example .env.local
#   → Supabase Dashboard → Project Settings → API 값으로 채운다 (아래 표 참고)

# 3. 개발 서버
npm run dev          # http://localhost:3000

# 4. (선택) 관리자 계정 생성
npm run create-admin                         # .env의 ADMIN_EMAIL/PASSWORD 사용
# 또는
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=change-me npm run create-admin
```

### npm scripts

| Script | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 결과 실행 |
| `npm run lint` | ESLint |
| `npm run create-admin` | 관리자 Auth 계정 생성 (service role 필요) |

---

## 환경 변수

`.env.local.example` 기준. **시크릿 값은 커밋 금지** (`.env.local`은 gitignore됨).

| 변수 | Scope | 용도 |
|------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | client+server | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client+server | Anon key (RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Auth admin API, 관리자 이메일 조회 — **절대 노출 금지** |
| `NEXT_PUBLIC_SITE_URL` | client+server | 매직링크 리다이렉트·알림 링크 (로컬: `http://localhost:3000`) |
| `TEACHER_APPLY_CODE` | server | 강사 초대코드 (기본 `twk2026`) |
| `RESEND_API_KEY` | server | 이메일 발송 (없으면 알림 silent 실패) |
| `NOTIFY_FROM_EMAIL` | server | Resend 발신 주소 |
| `SLACK_WEBHOOK_URL` | server | Slack 알림 (선택) |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | server | `create-admin` 기본값 (선택) |

---

## Supabase 셋업

별도 dev 프로젝트에 새로 붙이는 경우:

1. **마이그레이션 적용** — `supabase/migrations/` 순서대로:
   `001 → 002 → 003 → 004 → 005 → 007 → 008`
   (`007`은 `006`의 idempotent superset이므로 `006` 대신 `007` 사용)
2. **시드** — `supabase/seed.sql` (층/floors 등)
3. **Auth Redirect URLs** 등록:
   ```
   http://localhost:3000/auth/callback
   https://www.thewellnesskorea.com/auth/callback
   https://thewellnesskorea.com/auth/callback
   ```
4. **Magic Link 이메일 템플릿** — 어떤 기기에서도 로그인되도록 `token_hash` 방식 사용
   (Authentication → Email Templates → Magic Link):
   ```html
   <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=magiclink">로그인하기</a>
   ```
5. **Storage 버킷** — `person-photos`, `session-photos` (public read, 5MB, jpeg/png/webp)

데이터 모델·RLS·enum 상세는 [`docs/database-schema.md`](docs/database-schema.md) / [`docs/database-erd.md`](docs/database-erd.md).

---

## 프로젝트 구조

```
app/
  page.tsx                 공개 홈페이지
  apply/                   강사 셀프 등록 (매직링크) + actions
  auth/callback/           매직링크 콜백 (token_hash | code)
  teacher/                 강사 포털 (로그인·대시보드·설정) + actions
  admin/                   관리자 (people·schedule) + actions
components/                도메인별 UI (admin, apply, teacher, schedule, people, ui …)
lib/
  supabase/                client · server · service · middleware 클라이언트
  auth/ apply/             역할·계정 프로비저닝·매직링크 링킹
  people/ schedule/        쿼리·검증·persist·레이아웃·시간(KST) 로직
  notifications/           Resend·Slack 알림
  paths/                   철학 path 메타데이터
supabase/migrations/       DB 스키마 원천 (001–008)
docs/                      설계 문서 4종 (아래)
scripts/create-admin.mjs   관리자 계정 생성
middleware.ts              세션 갱신 + 라우트 가드
```

---

## 배포

- **Vercel**에 배포, **Gabia DNS**로 도메인 연결.
- 도메인: `https://www.thewellnesskorea.com` (apex `thewellnesskorea.com` → 308 redirect to www).
- 배포 전 체크: Vercel 환경변수 등록, Supabase 마이그레이션 적용, Auth redirect URL,
  프로덕션 다중 수신 이메일을 위한 Resend 도메인 인증.
- 상세 체크리스트: [`docs/site-map-and-flows.md`](docs/site-map-and-flows.md) → Deployment checklist.

---

## 📖 문서

신규 개발자 온보딩 및 설계 추적용. **단일 진실 공급원(SSOT)** 은 각 문서가 담당하는 영역이다.

| 문서 | 내용 |
|------|------|
| [`docs/site-map-and-flows.md`](docs/site-map-and-flows.md) | 서비스 지도·URL 맵·사용자 플로우·화면 계층·인프라·env |
| [`docs/backend-architecture.md`](docs/backend-architecture.md) | 인증/인가·상태 전이·비즈니스 규칙·lib/Server Actions 맵 |
| [`docs/database-schema.md`](docs/database-schema.md) | 테이블·enum·RLS·Storage·마이그레이션 이력 |
| [`docs/database-erd.md`](docs/database-erd.md) | Mermaid ERD·관계표·public read 경로 |

> ⚠️ **커밋·배포 전 문서 동기화 필수** (`.cursor/rules/docs-before-commit.mdc`)
> 코드 변경 시 위 4종 문서를 전체 기준으로 대조·최신화하고 **같은 커밋에 포함**한다.
> `supabase/migrations/`가 스키마의 원천이며, 미구현 항목은 각 문서의 *Not yet implemented*에만 둔다.

---

## 미구현 (요약)

- 공개 홈페이지 `#schedule`을 실제 `sessions`와 연동 (현재 mock)
- 참가자 예약/결제 (`bookings`), 대기열
- 강사 비밀번호 찾기(비로그인) 페이지
- 프로덕션 다중 관리자 수신용 Resend 도메인 인증

전체 목록은 각 `docs/` 문서의 *Not yet implemented* 섹션 참고.
