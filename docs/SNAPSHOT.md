# Snapshot — 2026-05-18 (저녁)

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).

## 현재 위치 — Phase 1 (MVP) 완료 + Cache Components 완전 정착

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
| `/api/cron/midnight` | Dynamic (Vercel Cron) | KST 자정마다 4개 태그 무효 |

## 2026-05-18 한 일 — 캐시 아키텍처 완성

### 문제 발견
배포에서 페이지 진입이 0.3~4초씩 걸림. 원인: 모든 (authed) 페이지가 `cookies()` 만지고 있어 Next.js가 Dynamic 강제 → 매 요청마다 Lambda 콜드 스타트.

### 해결
1차 시도(`unstable_cache`)는 Lambda 콜드 스타트 영향 그대로라 폐기. 2차 정답:

- `next.config.ts`에 `cacheComponents: true` 활성화
- 5개 list 페이지에 `'use cache'` + `cacheTag` + `cacheLife('days')` 적용 → **빌드 타임 prerender → Vercel CDN에서 직접 서빙** (Lambda 우회)
- Server Action: `revalidatePath("/", "layout")` → `updateTag(resource)` (read-your-own-writes)
- 매일 자정에 `/api/cron/midnight` Vercel Cron이 모든 태그 `revalidateTag(tag, "max")` (오늘 날짜 갱신용)

### 추가된 인프라
- `src/lib/queries/{home,students,books,teachers,loans}.ts` — `'use cache'` 페이지가 호출하는 read 함수
- `src/lib/supabase/service.ts` — service-role 클라이언트 (cached read 전용)
- `src/lib/date.ts` — `todayIso()` 단일 정의 (9개 파일에서 import)
- `src/components/layout/today-date.tsx` — 날짜 표시 client 컴포넌트
- `src/app/api/cron/midnight/route.ts` — Cron 엔드포인트 (`CRON_SECRET` 검증)
- `vercel.json` `crons: [{ path: "/api/cron/midnight", schedule: "0 15 * * *" }]`

### 문서
- **CLAUDE.md 재작성** — 3계층 캐싱, 3개 Supabase 클라이언트 역할, `'use cache'` 제약, layer responsibilities를 정석 아키텍처로 정리
- `README.md` — Seoul Supabase project ref, `CRON_SECRET` 안내 갱신
- `.env.example` — `CRON_SECRET` 추가

### 최종 커밋 흐름
- `8c55a09` 1차 시도 (unstable_cache + 새 구조) — 작동 미흡
- `859a8cd` 2차 정답 (Cache Components) — CDN 캐싱 정착
- `79d76d8` 캐시 1일 + Cron + CLAUDE.md 재작성 + 정리
- `<이번 commit>` lib/sort/loans.ts의 마지막 로컬 todayIso 정리

## 박제 정책 (재확인용)

- **DB는 데이터 저장 전용** — trigger·custom function 만들지 않음.
- **Server-only data flow** — 브라우저 클라이언트 X. 3개 Supabase 클라이언트(`server.ts`/`service.ts`/`session.ts`)만 사용.
- **'use cache' 제약** — cookies/headers/searchParams 만지지 마라, 비결정적 값(`new Date()`)은 인자로 전달.
- **Mutation 후 `updateTag(resource)`** — read-your-own-writes 보장.
- **Cron은 HTTP route + Bearer 검증** — 서버리스 구조상 자체 타이머 불가, Vercel Cron이 정시에 우리 endpoint를 호출하는 패턴.

## Tag 매핑 (참고)

| 태그 | 무효 트리거 | 의존 쿼리 |
|---|---|---|
| `students` | student CRUD/CSV | home, students, loans |
| `books` | book CRUD/CSV | students, books, loans |
| `teachers` | teacher CRUD/CSV | teachers, loans |
| `loans` | lend/return (operation, /loans) | 모든 쿼리 |

## ⚠️ 집에 가서 첫번째로 해야 할 일 — 배포 검증

집에서 작업 재개하면 **반드시** 이 검증부터:

### 1. Vercel 배포 성공 확인
- Vercel Dashboard → Deployments → 최신 배포 commit `<이번 commit>` 가 Success인지

### 2. `CRON_SECRET` 확인
- Vercel Dashboard → Project Settings → Environment Variables
- `CRON_SECRET` 항목이 있고 **Production** 환경에 체크돼 있는지
- 없으면 → 로컬 `.env`와 같은 값으로 추가 → 재배포 한 번 필요

### 3. CDN 캐시 작동 확인 (가장 중요)
- 시크릿 창에서 사이트 접속 → 로그인 → `/students` 이동
- DevTools → Network → 주소창 커서 두고 `Cmd+R` (F5) 새로고침
- Network 탭에 **`students` 메인 문서 요청**이 나타남 (`?_rsc=` 없는 것) → 클릭
- Headers → Response Headers에서 **`x-vercel-cache`** 값 확인
  - `HIT` 또는 `PRERENDER` → 🎉 성공
  - `MISS` → 한 번 더 새로고침 → 두 번째에 HIT 나와야 정상
- 응답 시간(Network → Timing 또는 옆 Time 컬럼) 50~100ms 수준이면 완벽

### 4. updateTag 검증
- /students에서 학생 한 명 추가 → 폼 제출 후 /students 돌아옴
- **새 학생이 즉시 목록에 보여야 함** (캐시 무효 + 재생성 후 응답)

### 5. Cron 등록 확인
- Vercel Dashboard → Crons 탭 (또는 Project → Settings → Cron Jobs)
- `/api/cron/midnight`가 `0 15 * * *` 스케줄로 등록돼 있고 다음 실행 시각이 표시되는지
- 다음 자정 후 Logs에서 200 OK 응답 확인

## 다음 작업 후보

위 검증이 다 통과하면 그 다음 우선순위:

### 🔥 Phase 2 시작 후보 (운영 편의)

| 항목 | 작업량 | 가치 |
|---|---|---|
| 추세 통계 (인기 도서 Top N, 학년별 빈도) | 중 | 관리자가 운영 인사이트 얻음 |
| 학년 진급 일괄 처리 / 6학년 졸업 | 중 | 매년 3월 필수 작업 |
| 책·학생 일괄 작업 (체크박스 다중 선택) | 중 | 운영 효율 |

### 🛠 정리 후보 (선택)

| 항목 | 비고 |
|---|---|
| Layout admin email 복구 (`process.env.ADMIN_EMAIL`) | 단일 관리자라도 표시 친절. 정적 주입이라 캐시 안 깨짐 |
| `operation-data.tsx` 134줄 분해 | 늘어나면 그때. 지금은 같은 영역 변형이라 한 파일 유지 OK |
| `book-form-dialog.tsx` 275줄 분해 | 표지 picker + 언어 토글을 sub-component로 |
| CSV Dialog 공통 추출 | teachers/students/books 3중복. 추상화 시점 도달 |
| Delete Dialog 공통 추출 | 동일 3중복 |

### 🌐 Phase 3 (장기)

- ISBN API → 책 정보·표지 자동 채우기
- 일괄 반납 (방학·졸업)
- CSV 백업·내보내기
- 연체 알림 (대여 상세 모달의 "알림 보내기")

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

## .env 키 목록 (5개)

```env
NEXT_PUBLIC_SUPABASE_URL=https://sxlxetjqhaszbzvxfcwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=admin@thehim.school
CRON_SECRET=<openssl rand -base64 32 결과>
```

## 새 PC 재개 절차

1. `git clone https://github.com/tkdgns25300/school_library`
2. `cd school_library && git checkout dev && npm install`
3. **`.env` 복원** — 5개 키 모두. 1Password 등 보안 채널.
4. (AI 작업하려면) Supabase MCP 등록 — README "Supabase MCP" 섹션 참조
5. `npm run dev`로 띄우고 동작 확인
6. 새 슬라이스 진입 (위 "다음 작업 후보" 참조)
