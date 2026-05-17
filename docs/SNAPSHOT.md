# Snapshot — 2026-05-17

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).

## 현재 위치 — Phase 1 (MVP) 완료, 폴리싱 진행 중

5페이지 모두 운영 가능 + 디자인/성능 폴리싱 한 사이클 끝남.

| 라우트 | 이름 | 기능 |
|---|---|---|
| `/login` | 로그인 | Playfair Display 헤더, 카드 레이아웃, Library 아이콘 |
| `/` | **대여 데스크** (홈) | 반 카드 3개 + 실 KPI |
| `/operation/[section]` | **대여 데스크** (반별) | 한·영 칼럼, lend/return + 활성 대여 리스트 |
| `/students` | 학생 | CRUD + CSV + KO/EN (대여/연체) |
| `/teachers` | 교사 | CRUD + CSV |
| `/books` | 책 | CRUD + 표지 Storage + CSV + 라벨 PDF + 상태 토글 |
| `/loans` | **대여 현황** | 회수 우선순위 표 + KPI + 상세 모달 |

**최신 커밋**: `057e869` (Dim sidebar logo/admin badges and active nav to deep navy)

## 2026-05-16 ~ 17 한 일

### 인프라
- **Supabase 도쿄(`lwjzyuxjwdeolmsmmmhi`) → 서울(`sxlxetjqhaszbzvxfcwu`) 마이그레이션** (MCP로 자동화).
  - 신규 프로젝트: region `ap-northeast-2`, 마이그레이션 SQL 그대로 적용.
  - **`.env` 키 3개 모두 교체** (URL, anon, service_role). Vercel 환경변수도 동일.
  - Sydney 프로젝트는 삭제됨.
- Vercel `vercel.json`에 `regions: ["icn1"]` + 페이지별 `preferredRegion = ["icn1"]` — Vercel 함수 서울로.

### UI 폴리싱
- **로그인 페이지**: 카드 레이아웃 + Library 아이콘 + Playfair Display(`School Library`) + placeholder + 큰 primary 버튼.
- **사이드바**:
  - "운영 화면" → **"대여 데스크"** / "모니터링" → **"대여 현황"** (페이지 헤더·라우트 라벨·정렬 코멘트·docs까지 일괄)
  - 접기 토글 추가 (`localStorage` 영속, 폭 w-60↔w-16, 아이콘만 모드)
  - 로그아웃: 텍스트 링크 → 관리자 카드 옆 아이콘 버튼
  - 색상: 활성 nav/로고 박스/관 배지를 짙은 navy(`--sidebar-badge` 0.30 0.08 265, `--sidebar-primary` 0.34 0.11 265)로 차분하게
- `LANGUAGE_SUBTITLE` 제거 ("Picture books · Readers · Chapter books" 류 부가 안내)

### 성능 / 캐시 (검증 미완)
- 5페이지에 `export const revalidate = 1800` 추가 (`/`, `/students`, `/books`, `/teachers`, `/loans`). `/operation/[section]`은 의도적으로 캐시 X.
- 모든 actions의 `revalidatePath`를 nuclear 옵션 `revalidatePath("/", "layout")`로 통일.
- **⚠️ 검증 미완 의문**: 페이지가 cookies 읽는 dynamic route(빌드 로그 `ƒ` Dynamic)라서 `revalidate=1800`이 무력화될 가능성. 실제로 같은 페이지 두 번째 방문 시 timing이 거의 안 줄어든다는 사용자 피드백 있음. **다음 세션 첫 작업으로 검증 필요**.

## 다음 작업 후보 (우선순위 순)

### 🔥 즉시 (성능 검증)
1. **캐시 작동 검증**:
   - 같은 페이지 두 번 클릭 후 timing 비교. 두 번째도 비슷하면 페이지 캐시 안 먹는 거.
   - Response Headers의 `x-vercel-cache` 값 확인 (`HIT` / `MISS` / `STALE`).
2. **(작동 안 하면) `unstable_cache` 패턴으로 refactor**: 페이지는 dynamic 유지, **쿼리만 캐싱**. 5페이지 데이터 fetching wrapper로 묶고 actions은 `revalidateTag`로.

### 정리 (Phase 2 진입 전 권장)
1. CSV Dialog 추상화 — teachers/students/books 3중복 → 공통화
2. Delete Dialog 추상화 — 동일 3중복
3. `book-form-dialog.tsx` 분해 (275줄, 표지 picker·언어 토글 sub) — 선택

### Phase 2 (운영 편의)
- 추세 통계 (인기 도서 Top N, 학년별 빈도)
- 학년 진급 일괄 처리 / 6학년 졸업 처리
- 책·학생 일괄 작업
- (선택) Vercel Cron으로 매일 자정 캐시 무효화 (연체 경계 보정)

### Phase 3 (선택)
- ISBN API → 책 정보·표지 자동 채우기
- 일괄 반납 (방학·졸업)
- CSV 백업·내보내기
- 연체 알림

## 새 PC 재개 절차

1. `git clone https://github.com/tkdgns25300/school_library`
2. `cd school_library && git checkout dev && npm install`
3. **`.env` 복원**: Supabase Seoul 프로젝트 키 사용 (project ref `sxlxetjqhaszbzvxfcwu`)
   - 1Password / 보안 채널로 기존 PC `.env` 복사가 가장 빠름
   - 또는 Dashboard `https://supabase.com/dashboard/project/sxlxetjqhaszbzvxfcwu` → Settings → API에서 재발급
4. (AI 작업하려면) **Supabase MCP 등록**:
   ```bash
   claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase@latest --access-token=YOUR_PAT
   ```
   PAT는 본인 터미널에서 직접 (채팅 노출 X). Claude Code 재시작 / `/mcp` 로 로드.
5. `npm run dev` 또는 새 슬라이스 진입.

## 환경 정보

| 항목 | 값 |
|---|---|
| Supabase project ref | `sxlxetjqhaszbzvxfcwu` (region `ap-northeast-2` Seoul) |
| Supabase URL | `https://sxlxetjqhaszbzvxfcwu.supabase.co` |
| GitHub repo | `https://github.com/tkdgns25300/school_library` |
| Vercel project | `school_library` (Production = `main`, Function region `icn1`) |
| Admin account | `admin@thehim.school` |
| Storage 버킷 | `book-covers` (public read, authenticated write) |

## 박제 정책 (재확인용)

- **DB는 데이터 저장 전용** — trigger·custom function·복잡 default 만들지 않음. 비즈니스 로직은 Server Action / Server Component에서.
- **Server-only data flow** — Supabase는 무조건 Next.js Server를 거침. 브라우저 클라이언트 X.
- **Next.js 16 Proxy** — `src/middleware.ts` X, `src/proxy.ts` 사용. runtime config 설정 금지.
- **MCP는 SQL·마이그레이션·타입 생성·프로젝트 관리용** — 앱 런타임 통로와 별개.
- **revalidatePath nuclear pattern** — 모든 actions이 `revalidatePath("/", "layout")`. cross-page 누락 위험 0.

## 알려진 미세 사항 (운영 시작에 영향 X)

- `nextBookId`는 max(id)+1 — 단일 관리자 race 무시
- `cover_image_url`은 Storage path를 가리키며, 책 삭제 시 가능한 확장자 다 시도 (jpg/jpeg/png/webp/gif)
- 학생 명단 (대여/연체) 컬럼은 페이지 진입 시 fetch (캐시 검증 끝나면 더 빨라질 예정)
- `revalidate=1800` 설정은 됐으나 dynamic route라 실제 적용 여부 검증 필요 (다음 세션 즉시 과제)
