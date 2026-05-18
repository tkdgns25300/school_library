# CLAUDE.md — School Library

> **이 파일은 HOW** — 아키텍처·캐싱 전략·코드 컨벤션. 페이지 기능은 [`docs/SPEC.md`](./docs/SPEC.md), DB·Storage는 [`docs/SCHEMA.md`](./docs/SCHEMA.md), 진행 상황은 [`docs/ROADMAP.md`](./docs/ROADMAP.md), 환경·재개 가이드는 [`README.md`](./README.md), 시점 핸드오프는 [`docs/SNAPSHOT.md`](./docs/SNAPSHOT.md).
>
> **문서 책임 분리** — 같은 사실을 두 곳에 쓰지 않는다. 아키텍처·컨벤션은 여기, 페이지 명세는 SPEC, DB는 SCHEMA, 작업은 ROADMAP, 환경 정보는 README.

## Project

더힘스쿨 수지점(기독교 대안학교, 1~6학년) 도서 대여 관리 웹앱. 교사 다수가 단일 관리자 계정으로 공용 로그인.

**Stack**: Next.js 16 (App Router, Cache Components) · React 19 · TypeScript strict · Tailwind v4 + shadcn/ui (Base UI) · Supabase · Vercel · npm

> ⚠️ **Next.js 16 / React 19 / Cache Components**: 학습 데이터와 다를 수 있음. 코드를 작성·수정하기 전에 `node_modules/next/dist/docs/`의 해당 가이드를 먼저 확인할 것 (특히 `'use cache'`, `cacheTag`, `cacheLife`, `updateTag`, `revalidateTag`).

## Architecture Overview

### 3계층 캐싱

```
[브라우저]
   │
   ▼
[Vercel Edge CDN]  ← 5개 list 페이지는 prerender본 직접 서빙 (10~50ms)
   │ ↓ MISS
   ▼
[Vercel 함수 (Node.js)]  ← 'use cache' 코드 실행, mutation, dynamic 페이지
   │
   ▼
[Supabase Seoul]
```

| 페이지 | 모드 | 이유 |
|---|---|---|
| `/`, `/students`, `/books`, `/teachers`, `/loans` | `'use cache'` (CDN 캐시) | 데이터 변경 빈도 낮음, 모든 교사가 같은 뷰 |
| `/operation/[section]` | Partial Prerender (shell static, data dynamic) | 대여/반납 desk — 매번 fresh 필요 |
| `/login`, `/api/cron/midnight` | Static / Dynamic | 공개 / 인증된 작업용 |

### 캐시 무효화 (3가지 트리거)

1. **Mutation 시 즉시** — `actions.ts`의 모든 Server Action 마지막에 `updateTag(resource)` 호출 (read-your-own-writes)
2. **자동 만료** — `cacheLife('days')` = 1일 revalidate, 1주 expire (백그라운드 재검증)
3. **매일 자정** — Vercel Cron(`/api/cron/midnight`)이 `revalidateTag(tag, "max")`로 모든 4개 태그 무효 (KST 자정 = UTC 15:00)

### Tag 매핑

| 태그 | 무효 트리거 | 의존 쿼리 |
|---|---|---|
| `students` | 학생 CRUD/CSV | `getStudentsWithStats`, `getClassStats`, `getLoansForMonitoring` |
| `books` | 책 CRUD/CSV | `getBooksWithStatus`, `getStudentsWithStats`, `getLoansForMonitoring` |
| `teachers` | 교사 CRUD/CSV | `getTeachers`, `getLoansForMonitoring` |
| `loans` | lend/return (operation, /loans) | 모든 쿼리 |

각 페이지는 자기 데이터가 의존하는 모든 태그를 `cacheTag(...)`로 선언.

## Directory

```
src/
├── app/
│   ├── (authed)/                  proxy.ts 인증 게이트 통과 영역
│   │   ├── layout.tsx              shell (쿠키 사용 X)
│   │   ├── page.tsx                홈 ('use cache')
│   │   ├── students/, books/, teachers/, loans/
│   │   │   ├── page.tsx            'use cache' + cacheTag + cacheLife
│   │   │   ├── actions.ts          Server Action (mutation + updateTag)
│   │   │   ├── *-view.tsx          client component (UI)
│   │   │   └── *-dialog.tsx        client component (modals)
│   │   └── operation/[section]/
│   │       ├── page.tsx            shell + generateStaticParams + Suspense
│   │       ├── actions.ts          lend/return
│   │       └── *-view.tsx          UI
│   ├── login/                      Supabase Auth 로그인
│   ├── api/cron/midnight/          Vercel Cron 엔드포인트
│   └── layout.tsx                  root layout (폰트·메타)
├── components/
│   ├── layout/                     사이드바·헤더·서명·날짜
│   └── ui/                         shadcn
├── constants/                      도메인 enum (학년·반·언어)
├── hooks/                          client hooks (use-scanner 등)
├── lib/
│   ├── supabase/
│   │   ├── server.ts               쿠키 기반 — 인증·mutation 전용
│   │   ├── service.ts              service-role — cached read 전용
│   │   └── session.ts              proxy의 세션 refresh용
│   ├── queries/                    'use cache' 페이지가 호출하는 read 함수 (도메인 1개당 1파일)
│   ├── sort/                       정렬 헬퍼
│   ├── date.ts                     시간 유틸 (todayIso 등 단일 정의)
│   ├── barcode.ts                  bwip-js Code128 → PNG
│   ├── label-pdf.ts                pdf-lib A4 24-up
│   ├── download-labels.ts          blob 다운로드
│   └── utils.ts                    cn (Tailwind merge) 등
├── types/                          database.ts (Supabase 생성), domain.ts
└── proxy.ts                        Next.js 16 Proxy — 비인증 → /login 리다이렉트

supabase/migrations/                DB 마이그레이션 SQL
```

## Layer Responsibilities

### Page (`app/**/page.tsx`)
- **조합만** 한다. 로직·데이터 fetching·통계 계산 안 한다.
- `'use cache'` 페이지: `cacheTag(...)` + `cacheLife(...)` 호출 후 query 함수 호출 → view에 prop 전달
- dynamic 페이지: `<Suspense>`로 data 컴포넌트 감싸기

### Server Action (`app/**/actions.ts`)
- `"use server"` 디렉티브. 모든 mutation은 여기서.
- `createClient()` (server.ts, 쿠키 기반)으로 인증 보장된 호출
- 끝에서 `updateTag(resource)` — read-your-own-writes
- REST API 라우트 만들지 않는다.

### Query (`lib/queries/*.ts`)
- `'use cache'` 페이지에서 호출하는 read 전용 함수
- `createServiceClient()` (service.ts, 쿠키 X)
- 데이터 fetch + transform + return — 비즈니스 로직(통계 계산 등)은 여기에
- **쿠키·헤더 절대 만지지 마라** — cached scope 안에서 호출되므로

### View (`app/**/*-view.tsx`)
- `"use client"` 컴포넌트. 인터랙티브 UI 전담.
- prop으로 데이터 받음. 직접 fetch 안 함.
- 폼·필터·dialog 호출 등 사용자 인터랙션

### Dialog (`app/**/*-dialog.tsx`)
- `"use client"` 모달. form action 받아서 server action 호출.
- `useActionState` 또는 `useTransition` 사용.

### Components (`components/**`)
- 도메인 로직 없음. 재사용 UI만.
- `layout/` = 사이드바·헤더 같은 페이지 공통 요소
- `ui/` = shadcn 원본

## Supabase Client 사용 규칙

DB 접근은 아래 3개 파일을 통해서만. 새 클라이언트 만들지 말 것. 브라우저 클라이언트(`createBrowserClient`) 절대 X.

| 파일 | 키 | 쿠키 | 사용처 |
|---|---|---|---|
| `lib/supabase/server.ts` | anon | ✅ (세션) | `actions.ts` (모든 mutation), dynamic 페이지(`operation/[section]`) |
| `lib/supabase/service.ts` | service-role | ❌ | `lib/queries/*.ts` (cached read만) |
| `lib/supabase/session.ts` | anon | ✅ | `proxy.ts` 내부 세션 refresh용 (단독 사용 X) |

`service.ts`가 RLS를 우회하지만 안전한 이유: (authed) 라우트는 `proxy.ts`가 이미 인증 게이트. service-role 키는 서버 전용(`NEXT_PUBLIC_` 없음) → 브라우저 노출 0.

## `'use cache'` 제약 (필수 준수)

cacheComponents가 활성화된 상태(`next.config.ts`). 다음 규칙 어기면 빌드 실패하거나 캐시 동작 깨짐:

1. **cached scope 안에서 `cookies()`/`headers()`/`searchParams` 절대 호출 X**
2. **`new Date()` 등 비결정적 값은 캐시 생성 시점에 frozen** — 시간 의존 값은 인자로 전달
3. **dynamic 데이터(쿠키·요청 데이터)는 `<Suspense>`로 감싸기** — operation 페이지 패턴 참고
4. **`generateStaticParams` 활용** — 동적 segment가 한정적이면 (예: `[section]`은 3개) prerender로 shell 정적화

## DB Policy

- **DB는 데이터 저장 전용**. DB trigger·custom function·복잡한 default expression 만들지 않는다. ID 발급·timestamp 갱신·집계 등 모든 비즈니스 로직은 Server Action / Server Component / query 함수에서.
- 내장 기능(`gen_random_uuid()`, sequence `nextval()`, CHECK, FK)만 사용.

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
- 공유 타입은 `types/` 또는 `lib/queries/*.ts`(쿼리 반환 타입). 한 파일 전용 타입은 파일 상단.

**Styling**
- Tailwind 인라인. 별도 CSS 파일 X (`globals.css` 제외).
- shadcn/ui 우선. 커스텀은 필요할 때만.
- 데스크탑 우선(교사 PC + USB 스캐너), 모바일 조회 가능.

**Imports**
- 항상 `@/` alias. 상대 경로는 같은 폴더 내에서만.

## Domain Quick Reference

> 자세한 동작·UI 명세는 SPEC.md, DB 컬럼은 SCHEMA.md. 여기는 코드에서 자주 마주치는 상수와 규칙만.

**라우트 (5페이지 + 운영)**: `/` 대여 데스크 홈 · `/operation/[section]` 반별 대여 데스크 · `/loans` 대여 현황 · `/students` · `/teachers` · `/books`

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

**바코드 ID**: `BK00001`~. Server Action이 `nextval('book_id_seq')` 호출 후 `'BK' + lpad(value, 5, '0')`로 조립해 INSERT (DB 컬럼 default 없음).

**바코드 그림·스캔**: `bwip-js` Code128로 라벨 PDF에 렌더링. 스캔은 키보드 에뮬레이션이라 `<input>` + `onKeyDown(Enter)`로 받는다.

**표지 이미지**: Supabase Storage `book-covers` 버킷(public) 업로드, 반환된 public URL을 `books.cover_image_url`에 저장. 업로드/수정은 인증된 관리자만, 읽기는 public.

**인증**: Supabase Auth 단일 관리자 계정. 회원가입 UI 없음. **Proxy**(`src/proxy.ts`)가 (authed) 라우트 진입 시 비인증이면 `/login` 리다이렉트.

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
1. `npm run build` 통과 (TypeScript + Cache Components 검증)
2. 미사용 import/변수 없음
3. `any` 없음
4. 단일 책임 지킴
5. 네이밍만으로 역할 이해 가능
6. **새 페이지**: `'use cache'` + `cacheTag` + `cacheLife` 적절히 설정, 의존 태그 빠짐없음
7. **새 mutation**: actions.ts에서 끝에 `updateTag(resource)` 호출, 영향받는 모든 태그 invalidate
8. **DB 접근**: `lib/supabase/{server,service}.ts` 중 적절한 것 사용, 새 클라이언트 만들지 않음
9. **cached scope**: cookies/headers/searchParams 안 만짐, 비결정적 값(`new Date()`)은 인자로
