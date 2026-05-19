# School Library — 작업 로드맵

> 페이지·기능 명세는 [`SPEC.md`](./SPEC.md), DB·Storage는 [`SCHEMA.md`](./SCHEMA.md), 환경·재개 가이드는 [`../README.md`](../README.md).
> 브랜치: `main`(배포) / `dev`(작업). commit·push·merge는 사용자 명시 요청 시에만.

## Phase 0: 프로젝트 준비

### 인프라 (완료)

- [x] GitHub repo 생성 + clone
- [x] `dev` 브랜치 생성, dev에서 작업
- [x] CLAUDE.md, docs/*, README.md, .gitignore, .env.example
- [x] Next.js 16 + React 19 + Tailwind v4 + TypeScript strict 셋업
- [x] shadcn/ui (`base-nova` / Base UI / neutral) + 컴포넌트 22개 + `field`
- [x] 라이브러리: `bwip-js`, `papaparse`, `pdf-lib`, `@types/papaparse`
- [x] Supabase 프로젝트 생성
- [x] 마이그레이션 `supabase/migrations/001_init.sql` 적용 — 4테이블 + 시퀀스 + 인덱스 + RLS
- [x] Supabase Storage 버킷 `book-covers` (public read, authenticated write) 생성 + Storage RLS
- [x] 관리자 계정 생성 (`admin@thehim.school`)
- [x] `.env` 로컬 셋업 (gitignored — 복원 절차는 README)
- [x] Vercel 연결 + 첫 배포 (Production = `main`)

### 마무리 (완료)

- [x] Supabase 클라이언트 — `src/lib/supabase/{server,session}.ts` (`@supabase/ssr`, server-only 정책)
- [x] DB 타입 — `src/types/database.ts` (Supabase MCP 자동 생성)
- [x] 인증 Proxy — `src/proxy.ts` (Next.js 16 `proxy.ts`, `middleware.ts` 대체)
- [x] 로그인 페이지 — `src/app/login/page.tsx` + Server Action
- [x] 글로벌 레이아웃 — `(authed)/layout.tsx` + 사이드바 2그룹 + 헤더 + 관리자 박스

## Phase 1: MVP — 5페이지

> 각 페이지 동작은 SPEC.md 참조. 여기는 작업 단위 체크리스트.

### 1-1. 공통 골격 (완료)

- [x] 도메인 타입 (`src/types/domain.ts`) — `ClassSection`·`Language`·`Grade`
- [x] 정렬 헬퍼 (`src/lib/sort/students.ts`) — 학생 명단(학년→반→이름). 운영·대여 현황 정렬은 1-5/1-6에서 추가
- [x] 컬러 토큰 (한국어=남색, 영어=초록) — `globals.css` `--ko`/`--en` + Tailwind 클래스
- [x] 도메인 상수 — `src/constants/class-sections.ts`(CLASS_SECTIONS·CLASS_SECTION_ORDER·isValidGradeClassSection)·`languages.ts`
- [x] 사이드바 접기 토글 — `localStorage` 기반, 폭 w-60 ↔ w-16, 아이콘만 남는 모드

### 1-2. 학생 명단 (완료)

- [x] 목록 (학년 ↑ → 반 → 이름)
- [x] 한국어 (대여/연체), 영어 (대여/연체) 컬럼 — placeholder `—` (실제 join은 1-6에서)
- [x] 검색·필터 (이름·학년·반)
- [x] 추가/수정/삭제 UI (학년·반 복합 CHECK 자동 보정)
- [x] CSV 업로드 + 검증 리포트

### 1-3. 교사 명단 (완료)

- [x] 목록 (이름·담당 반)
- [x] 추가/수정/삭제 UI
- [x] CSV 업로드

### 1-4. 책 목록 (완료)

- [x] 한/영 탭 + 권수 표시 (underline tabs)
- [x] 상태 토글 (전체 / 대여 가능 / 대여 중) — placeholder, 실제 join은 1-6에서
- [x] 검색·필터 (제목·저자·단계)
- [x] 추가 폼 (자동 ID + 표지 파일 업로드 → Storage)
- [x] 수정/삭제 UI (삭제 시 Storage 객체 정리)
- [x] CSV 업로드 (바코드 자동 발급)
- [x] 다중 선택 → A4 라벨 PDF 출력 (24-up 격자, bwip-js Code128 + pdf-lib)
- [x] 바코드 클릭 → 단일 미리보기 + 다운로드 dialog

### 1-5. 운영 (완료)

- [x] 반 카드 KPI 실제 데이터 (학생·대여 중·연체 count) + 클릭 시 반별 화면 이동
- [x] 반별 대여 데스크 라우트 — `/operation/[section]`
  - [x] 상단 KPI + `← 반 선택` 복귀
  - [x] 한·영 1:1 두 칼럼 (KO/EN 컬러 토큰 일관)
  - [x] 칼럼 헤더 (권수·연체)
  - [x] 대여/반납 모드 토글
  - [x] 학생 + 반납 예정일(기본 7일) + 담당 교사 선택
  - [x] 바코드 입력 (자동 포커스, 연속 스캔, 스캔 시 표지 미리보기)
  - [x] 잘못된 칸 안내 토스트 (sonner)
  - [x] 대여 중 리스트 (연체 먼저 → 학년 ↑ → 이름) + 연체 좌측 빨간 stripe + `+N일` pill
- [x] 활성 대여 없는 책 반납 시도 / 이미 대여 중인 책 대여 시도 경고
- [x] 반(class_section) 가드 — 다른 반 책 반납 시도 시 안내
- [x] sonner `<Toaster />` `(authed)/layout.tsx`에 설치

### 1-6. 대여 현황 (완료)

- [x] `/loans` 라우트 (사이드바 "대여 현황")
- [x] KPI 카드 3개 (전체 대여 중 / 연체 + 최장 일수 / 오늘 반납 예정)
- [x] 검색 (학생·책·바코드) + 언어 토글 + 반 드롭다운
- [x] 활성 대여 행 (책 표지 썸네일 + 학년·반·학생·책·언어·반납 예정·상태)
- [x] 정렬 (연체 먼저 → 학년 ↑ → 반납 예정일 ↑) — `sortLoansForRecall`
- [x] 행 클릭 → 대여 상세 모달 + 반납 처리 (`returnLoanById`)
- [x] 학생 명단 (대여/연체) 컬럼 실제 데이터 join — KO 남색·EN 초록 텍스트
- [x] 책 목록 상태 토글(전체/대여 가능/대여 중) + 상태 배지 ("대여 가능"/"대여 중")

> **Phase 1 (MVP) 완료** — 5페이지 모두 운영 가능 상태.

## Phase 1.5: 캐싱 인프라 (완료)

> 배포 후 페이지 진입 0.3~4초 문제 해결. Vercel CDN에서 직접 서빙되도록 전환.

- [x] `cacheComponents: true` 활성 — `next.config.ts`
- [x] 5개 list 페이지(`'use cache'` + `cacheTag` + `cacheLife('days')`) — `/`, `/students`, `/books`, `/teachers`, `/loans`
- [x] Server Action mutation → `updateTag(resource)` 일관 (read-your-own-writes)
- [x] service-role Supabase 클라이언트 — `src/lib/supabase/service.ts` (cached read 전용)
- [x] cached read 함수 분리 — `src/lib/queries/{home,students,books,teachers,loans}.ts`
- [x] operation 페이지 Partial Prerender — `<Suspense>` + `generateStaticParams`
- [x] `PageHeader`의 `new Date()` 부분 client 컴포넌트로 분리 (`TodayDate`)
- [x] Vercel Cron — `/api/cron/midnight` KST 자정마다 모든 태그 `revalidateTag(tag, "max")`
- [x] `CRON_SECRET` 인증 + `.env.example`·README·Vercel env 등록
- [x] `lib/date.ts` `todayIso()` 단일화 (9곳 import)
- [x] CLAUDE.md 재작성 — 정석 아키텍처 박제

> **검증 완료** (2026-05-19): `X-Action-Revalidated: 1` (mutation 무효), `X-Vercel-Cache: REVALIDATED` (재생성), Cron 등록 `Next run: UTC 15:00` 확인.
> ⚠️ Vercel Hobby plan은 1-hour flexible window이라 cron이 KST 00:00~01:00 사이에 발동될 수 있음.

## Phase 2: 운영 편의

- [ ] **책 CSV/XLSX 양식·필드 확정 (운영팀 협의)** — 현재 `title/language/author/publisher/grade_level/level/cover_image_url` 7개 컬럼. 실제 학교 운영에서 필요한 필드·필수 여부 재검토 필요.
- [ ] 추세 통계 (인기 도서 Top N, 학년별 대여 빈도)
- [ ] 학년 진급 일괄 처리 / 6학년 졸업 처리
- [ ] 책·학생 일괄 작업
- [ ] CSV Dialog / Delete Dialog 공통 컴포넌트 추출 (현재 3개 동일 구조)

## Phase 3: 선택

- [ ] ISBN API → 책 정보·표지 자동 채우기
- [ ] 일괄 반납 (방학·졸업)
- [ ] CSV 백업·내보내기
- [ ] 연체 알림 (대여 상세 모달의 "알림 보내기")
