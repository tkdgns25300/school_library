# CLAUDE.md — School Library

> **이 파일은 HOW** — 코딩 컨벤션·아키텍처·도메인 룰. 페이지 기능은 [`docs/SPEC.md`](./docs/SPEC.md)(WHAT), DB·Storage는 [`docs/SCHEMA.md`](./docs/SCHEMA.md)(DATA), 진행 상황은 [`docs/ROADMAP.md`](./docs/ROADMAP.md)(TODO), 환경·재개 가이드는 [`README.md`](./README.md).
>
> **문서 책임 분리** — 같은 사실을 두 곳에 쓰지 않는다. 컨벤션은 여기, 페이지 명세는 SPEC, DB는 SCHEMA, 작업은 ROADMAP, 환경 정보는 README.

## Project

더힘스쿨 수지점(기독교 대안학교, 1~6학년) 도서 대여 관리 웹앱. 교사 다수가 단일 관리자 계정으로 공용 로그인.

**Stack**: Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 + shadcn/ui (Base UI) · Supabase · Vercel · npm

> ⚠️ **Next.js 16 / React 19 breaking changes**: 학습 데이터와 다를 수 있음. Next.js·React 코드를 작성·수정하기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 먼저 확인할 것 (라우팅, Server Components, Server Actions, 캐싱, 데이터 fetching 등).

## Architecture

```
src/
├── app/          페이지 (page.tsx, layout.tsx만 — 조합·라우팅 외 로직 X)
├── components/   재사용 UI (도메인 로직 없음)
│   └── ui/       shadcn/ui 컴포넌트
├── constants/    상수 (학년 범위, 반 종류, 바코드 prefix 등)
├── hooks/        클라이언트 훅 (스캐너 입력 등)
├── lib/          비즈니스 로직 + Supabase 클라이언트·스토리지 + barcode/csv/pdf 헬퍼
└── types/        database.ts (Supabase 생성), domain.ts (도메인 타입)

supabase/migrations/   DB 마이그레이션 SQL
```

**원칙**:
- 서버 컴포넌트 기본. 클라이언트 컴포넌트는 입력/이벤트가 필수일 때만 (`"use client"` 명시).
- 데이터 변경은 **Server Actions**. REST API 라우트 남발 금지.
- DB 접근은 **`lib/supabase`를 통해서만**. 컴포넌트가 직접 `supabase-js` 호출 X.
- 폴더·파일명은 영어 kebab-case (`book-card.tsx`, `use-scanner.ts`).

## Clean Code Principles

- **단일 책임**: 한 함수/컴포넌트는 한 가지 일만. 60줄 넘으면 분해 검토.
- **명명이 곧 문서**: 의도가 드러나는 이름. 주석은 *왜*가 필요할 때만.
- **죽은 코드 즉시 삭제**: 미사용 import/변수/함수, 주석 처리한 코드 남기지 않음.
- **매직 값 금지**: 숫자/문자 리터럴은 `constants/`에. 도메인 상수도 마찬가지.
- **에러는 경계에서만**: 사용자 입력·외부 API 경계에서만 처리. 내부 호출에 방어 코드 남발 X.
- **타입으로 잘못된 상태를 표현 불가능하게**: `any` 금지. union/literal로 좁힌다.
- **추상화는 3번째에**: 한두 번 비슷한 코드는 그대로. 패턴이 굳으면 그때 추출.

## Code Conventions

**Naming**
- 파일/폴더: `kebab-case`
- 컴포넌트/타입: `PascalCase` (`BookCard`, `Loan`) — `I` prefix 금지
- 함수/변수: `camelCase` (`getActiveLoans`)
- 상수: `UPPER_SNAKE_CASE` (`MAX_GRADE`, `BARCODE_PREFIX`)
- Boolean: `is`/`has`/`should` 접두사

**TypeScript**
- `any` 금지. 불가피하면 `unknown` + 타입 가드.
- 공유 타입은 `types/`, 한 파일 전용 타입은 파일 상단.

**React/Next.js**
- 컴포넌트는 함수 선언문: `export default function Component()`.
- `app/` 페이지는 조합만. 로직은 `components/`·`lib/`로 분리.
- `useEffect` 최소화. 서버 컴포넌트나 핸들러로 대체 가능한지 먼저 검토.

**Styling**
- Tailwind 인라인. 별도 CSS 파일 X (`globals.css` 제외).
- shadcn/ui 우선. 커스텀은 필요할 때만.
- 데스크탑 우선(교사 PC + USB 스캐너), 모바일 조회 가능.

**Imports**
- 항상 `@/` alias. 상대 경로는 같은 폴더 내에서만.

## Domain Quick Reference

> 자세한 동작·UI 명세는 SPEC.md, DB 컬럼은 SCHEMA.md. 여기는 코드에서 자주 마주치는 상수와 규칙만.

**라우트 (5페이지로 고정)**: `/` 운영 · `/loans` 대여 현황 · `/students` · `/teachers` · `/books`

**페이지 역할 분리**:
- 학생 명단 = 학생 1명당 한 행 (학생 중심 뷰)
- 대여 현황 = 활성 대여 1건당 한 행 (회수 우선순위 뷰)

**도메인 enum**:
- `ClassSection`: `'junior 1'` · `'junior 2'` · `'senior 1'`
- `Language`: `'ko'` · `'en'`
- 학년-반 매핑: 1~3학년 ↔ junior 1/2, 4~6학년 ↔ senior 1 (DB CHECK + UI 모두 강제)

**컬러 코딩**: 한국어=남색, 영어=초록 (KO/EN 배지·헤더·구분선 일관)

**전역 정렬** (SPEC의 정렬 규칙 표가 단일 진실):
- 학생 명단: 학년 ↑ → 반(j1→j2→s1) → 이름
- 운영 대여 중 리스트: 연체 먼저 → 학년 ↑ → 이름
- 대여 현황: 연체 먼저 → 학년 ↑ → 반납 예정일

**바코드**: ID는 `BK00001`~ (PostgreSQL 시퀀스). 발급은 `bwip-js` Code128. 스캔은 키보드 에뮬레이션이라 `<input>` + `onKeyDown(Enter)`로 받는다.

**표지 이미지**: Supabase Storage `book-covers` 버킷(public) 업로드, 반환된 public URL을 `books.cover_image_url`에 저장. 업로드/수정은 인증된 관리자만, 읽기는 public.

**인증**: Supabase Auth 단일 관리자 계정. 회원가입 UI 없음. 미들웨어로 비인증 시 `/login`.

**담당자**: 대여·반납 시 `teachers`에서 dropdown 선택 → `loans.handled_by_teacher_id` / `returned_by_teacher_id`에 기록.

**라벨 인쇄 추적 X**: `printed` 컬럼 없음. 책 목록에서 다중 선택해 일회성 PDF 출력.

## Git Workflow

- 브랜치: `main`(배포) / `dev`(작업). feature 브랜치 X. 작업은 항상 `dev`에서.
- **commit / push / merge는 사용자가 명시적으로 요청할 때만**. 자동 커밋 금지.
- 커밋 메시지: 영어, 동사 원형 (Add/Fix/Update/Remove). 1 커밋 = 1 논리적 변경.

## 소통

- 사용자와의 대화는 **한국어**.
- 커밋 메시지·코드 식별자·주석은 **영어**.

## Quality Checklist

코드 작성 후 확인:
1. `npm run build` 통과
2. 미사용 import/변수 없음
3. `any` 없음
4. 단일 책임 지킴
5. 네이밍만으로 역할 이해 가능
