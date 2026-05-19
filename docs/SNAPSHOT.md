# Snapshot — 2026-05-19

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).

## 현재 위치 — Phase 1 + 1.5 완료, 검증 끝

5페이지 모두 운영 가능 + **Vercel CDN 캐싱 검증 완료**. 즉시 응답 상태.

| 라우트 | 모드 | 비고 |
|---|---|---|
| `/login` | Static | Supabase Auth 로그인 |
| `/` (대여 데스크 홈) | `'use cache'` Static | 1d revalidate, 1w expire |
| `/operation/[section]` | Partial Prerender | shell prerendered, data Suspense |
| `/students` | `'use cache'` Static | 1d revalidate |
| `/teachers` | `'use cache'` Static | 1d revalidate |
| `/books` | `'use cache'` Static | 1d revalidate |
| `/loans` | `'use cache'` Static | 1d revalidate |
| `/api/cron/midnight` | Dynamic Cron | KST 자정에 4개 태그 무효 |

**최신 main**: `3a0bc4d`

## 검증 결과 (2026-05-19)

| 항목 | 결과 |
|---|---|
| Vercel 배포 Success | ✅ `3a0bc4d` |
| `CRON_SECRET` Vercel env 등록 | ✅ Production |
| Cron 등록 확인 (Settings → Cron Jobs) | ✅ `/api/cron/midnight`, `0 15 * * *`, Enabled |
| Mutation `BYPASS` + `X-Action-Revalidated: 1` | ✅ |
| Mutation 직후 페이지 `REVALIDATED` (재생성) | ✅ |
| 새 학생 즉시 표시 (`updateTag` 작동) | ✅ |
| 페이지 응답 즉시 (사실상 ms 단위) | ✅ |

남은 검증: 자정 후 Cron 실제 실행 로그. **Vercel Hobby plan은 1-hour flexible window이라 KST 00:00~01:00 사이에 발동**. 내일 아침 Settings → Cron Jobs → View Logs 또는 Observability → Cron Jobs에서 확인 가능.

## 어제~오늘 한 일 요약

### 2026-05-17~18 (캐시 아키텍처)

- 0.3~4s 페이지 진입 문제 진단: 모든 (authed) 페이지가 `cookies()` 만져서 Dynamic 강제 → Lambda 콜드 스타트
- `unstable_cache` 시도 → Lambda는 그대로라 효과 미미, 폐기
- **Cache Components 적용**: `cacheComponents: true` + 5개 페이지 `'use cache'` + `cacheTag` + `cacheLife('days')` → CDN 직접 서빙
- Server Action: `revalidatePath` → `updateTag` (read-your-own-writes)
- Vercel Cron + `CRON_SECRET` — 매일 자정에 모든 태그 무효 (오늘 날짜 갱신용)
- CLAUDE.md 재작성 — 정석 아키텍처 박제
- 코드 정리: `lib/date.ts` 단일화, `operation/[section]/page.tsx` 분해, view type re-export 제거

### 2026-05-19 (검증)

- Vercel 배포 확인 + Cron 등록 확인
- DevTools Network로 헤더 검증: `X-Action-Revalidated`, `X-Vercel-Cache: REVALIDATED`
- 학생 추가 → 즉시 표시 확인
- 문서 동기화 (ROADMAP에 Phase 1.5 추가, SNAPSHOT·README 갱신)

## 박제 정책 (재확인용)

- **DB는 데이터 저장 전용** — trigger·custom function 만들지 않음.
- **Server-only data flow** — 브라우저 클라이언트 X. 3개 Supabase 클라이언트(`server.ts`/`service.ts`/`session.ts`)만.
- **'use cache' 제약** — cookies/headers/searchParams 만지지 마라. 비결정적 값(`new Date()`)은 인자로.
- **Mutation 후 `updateTag(resource)`** — read-your-own-writes 보장.
- **Cron** — HTTP route + Bearer 검증. 자체 타이머 불가, Vercel Cron이 정시 호출.

## Tag 매핑

| 태그 | 무효 트리거 (updateTag) | 의존 쿼리 |
|---|---|---|
| `students` | student CRUD/CSV | home, students, loans |
| `books` | book CRUD/CSV | students, books, loans |
| `teachers` | teacher CRUD/CSV | teachers, loans |
| `loans` | lend/return (operation + /loans) | 모든 쿼리 |

## 다음 작업 후보

### 🔥 권장: Phase 2 시작

| 항목 | 작업량 | 가치 |
|---|---|---|
| **추세 통계** (인기 도서 Top N, 학년별 빈도) | 중 | 운영 인사이트 ↑ |
| **학년 진급 일괄** / 6학년 졸업 | 중 | 매년 3월 필수 작업 |
| **책·학생 일괄 작업** (다중 선택 → 일괄 변경) | 중 | 운영 효율 |
| **CSV/Delete Dialog 공통 추출** | 작 | 3중복 정리 (Clean Code) |

### 🛠 정리 후보 (선택)

| 항목 | 비고 |
|---|---|
| Layout admin email 복구 | `process.env.ADMIN_EMAIL` 정적 주입 (캐시 안 깨짐) |
| `operation-data.tsx` 134줄 | 늘어나면 분해. 지금은 한 파일 OK |
| `book-form-dialog.tsx` 275줄 | 표지 picker·언어 토글 sub로 분해 |

### 🌐 Phase 3 (장기)

- ISBN API → 책 정보·표지 자동
- 일괄 반납 (방학·졸업)
- CSV 백업·내보내기
- 연체 알림

## 환경 정보

| 항목 | 값 |
|---|---|
| Supabase project ref | `sxlxetjqhaszbzvxfcwu` (region `ap-northeast-2` Seoul) |
| Supabase URL | `https://sxlxetjqhaszbzvxfcwu.supabase.co` |
| GitHub repo | `https://github.com/tkdgns25300/school_library` |
| Vercel project | `school_library` (Hobby plan, Production = `main`, Function region `icn1`) |
| Admin 계정 | `admin@thehim.school` |
| Storage 버킷 | `book-covers` (public read, authenticated write) |
| Cron | `/api/cron/midnight`, KST 매일 00:00 (UTC 15:00) ± 1h Hobby window |

## .env 키 (5개)

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
3. `.env` 복원 — 5개 키 모두. 1Password 등 보안 채널.
4. (AI 작업하려면) Supabase MCP 등록 — README "Supabase MCP" 섹션 참조
5. `npm run dev`로 띄우고 동작 확인
