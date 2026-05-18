# Snapshot — 2026-05-18

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).

## 현재 위치 — Phase 1 (MVP) 완료 + Cache Components 적용

5페이지 모두 운영 가능 + Vercel CDN 캐싱으로 사실상 즉시 응답.

| 라우트 | 모드 | 비고 |
|---|---|---|
| `/login` | Static | Supabase Auth 로그인 |
| `/` (대여 데스크 홈) | `'use cache'` Static | 1d revalidate, 1w expire |
| `/operation/[section]` | Partial Prerender | shell prerendered, data Suspense |
| `/students` | `'use cache'` Static | 1d revalidate |
| `/teachers` | `'use cache'` Static | 1d revalidate |
| `/books` | `'use cache'` Static | 1d revalidate |
| `/loans` | `'use cache'` Static | 1d revalidate |
| `/api/cron/midnight` | Dynamic (Cron) | KST 자정마다 전 태그 무효 |

## 2026-05-18 한 일

### 캐시 아키텍처 전환 (오늘의 큰 변화)

배포에서 `0.3~4s` 페이지 진입 시간 발견. 원인: 모든 (authed) 페이지가 `cookies()` 만지고 있어 Next.js가 Dynamic 강제 → Lambda 콜드 스타트마다 비용.

해결 단계:
1. **1차** (unstable_cache 시도) — 데이터 캐시는 되지만 페이지는 여전히 Lambda → 효과 미미. 폐기.
2. **2차** (현재) — `cacheComponents: true` + 5개 페이지 `'use cache'` → **빌드 타임 prerender → Vercel CDN에서 직접 서빙**. Lambda 우회.

### 추가된 인프라

- `src/lib/queries/{home,students,books,teachers,loans}.ts` — `'use cache'` 페이지가 호출하는 read 함수 (도메인별 1개)
- `src/lib/supabase/service.ts` — service-role 클라이언트 (쿠키 X, cached read 전용)
- `src/lib/date.ts` — `todayIso()` 단일 정의
- `src/components/layout/today-date.tsx` — 날짜 표시 client 컴포넌트 (cacheComponents가 server에서 `new Date()` 금지)
- `src/app/api/cron/midnight/route.ts` — Vercel Cron 엔드포인트 (`revalidateTag` 모든 태그)
- `vercel.json` — `crons` 등록 (`0 15 * * *` = KST 00:00)

### 아키텍처 변경

- 모든 Server Action: `revalidatePath("/", "layout")` → `updateTag(resource)` (read-your-own-writes)
- 각 페이지: `cacheTag(...)` + `cacheLife('days')` 선언
- `(authed)/layout.tsx`: `auth.getUser()` 제거 → 쿠키 의존성 제거 (proxy가 이미 인증 게이트)
- `operation/[section]/page.tsx`: 분해 → `operation-data.tsx` (Suspense fallback + content)
- `page-header.tsx`: 날짜 부분을 `<TodayDate />` client 컴포넌트로 분리

### 문서

- **CLAUDE.md 재작성** — 3계층 캐싱, Cache Components 제약, 3개 Supabase 클라이언트 역할 명시, layer responsibilities 등 정석 아키텍처 반영
- `README.md` — Supabase Seoul project ref, `CRON_SECRET` 안내, SNAPSHOT.md 링크 추가
- `.env.example` — `CRON_SECRET` 추가

## Tag 매핑 (참고)

| 태그 | 무효 트리거 (actions에서 updateTag) | 의존 쿼리 |
|---|---|---|
| `students` | student CRUD/CSV | home, students, loans |
| `books` | book CRUD/CSV | students, books, loans |
| `teachers` | teacher CRUD/CSV | teachers, loans |
| `loans` | lend/return (operation, /loans) | 모두 |

## 다음 작업 후보

### 검증 (배포 직후)

- 페이지 새로고침 시 Response Header의 `x-vercel-cache`가 `HIT`/`PRERENDER`인지 확인
- Vercel Dashboard → Cron 탭에서 매일 자정 실행 로그 확인
- 학생 추가 → /students 돌아왔을 때 즉시 새 학생 보이는지 (updateTag 검증)

### Phase 2 (운영 편의)

- 추세 통계 (인기 도서 Top N, 학년별 빈도)
- 학년 진급 일괄 처리 / 6학년 졸업 처리
- 책·학생 일괄 작업

### Phase 3 (선택)

- ISBN API → 책 정보·표지 자동 채우기
- 일괄 반납 (방학·졸업)
- CSV 백업·내보내기
- 연체 알림

## 환경 정보

| 항목 | 값 |
|---|---|
| Supabase project ref | `sxlxetjqhaszbzvxfcwu` (region `ap-northeast-2` Seoul) |
| Supabase URL | `https://sxlxetjqhaszbzvxfcwu.supabase.co` |
| GitHub repo | `https://github.com/tkdgns25300/school_library` |
| Vercel project | `school_library` (Production = `main`, Function region `icn1`) |
| Admin 계정 | `admin@thehim.school` |
| Storage 버킷 | `book-covers` (public read, authenticated write) |
| Cron | `/api/cron/midnight`, KST 매일 00:00 (UTC 15:00) |

## 박제 정책 (재확인용)

- **DB는 데이터 저장 전용** — trigger·custom function 만들지 않음.
- **Server-only data flow** — 브라우저 클라이언트 X. 3개 Supabase 클라이언트(`server.ts`/`service.ts`/`session.ts`)만 사용.
- **'use cache' 제약** — cookies/headers 만지지 마라, 비결정적 값(`new Date()`)은 인자로 전달.
- **Mutation 후 `updateTag`** — read-your-own-writes 보장.
- **Next.js 16 Proxy** — `src/middleware.ts` X, `src/proxy.ts` 사용.

## 새 PC 재개 절차

1. `git clone https://github.com/tkdgns25300/school_library`
2. `cd school_library && git checkout dev && npm install`
3. **`.env` 복원** — Seoul Supabase 키 + `CRON_SECRET`. 1Password 등 보안 채널.
4. (AI 작업하려면) **Supabase MCP 등록** (README 참조)
5. `npm run dev`
