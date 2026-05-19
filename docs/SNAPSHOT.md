# Snapshot — 2026-05-19 (밤, 반응형 작업 중)

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).

## 현재 위치

Phase 1(기능 5페이지) + Phase 1.5(캐시 인프라) + 디자인 통일 패스 + 브랜드 자산 완료. 데이터 초기화도 마침(`admin@thehim.school`만 남음).

**진행 중**: 반응형(모바일/태블릿) — 큰 줄거리 작업 끝났지만 디테일 점검 남음. 다음 세션에서 마무리.

**최신 main 커밋**: `ddd58b9` (이전 SNAPSHOT)

| 라우트 | 모드 | 비고 |
|---|---|---|
| `/login` | Static | Great Vibes 헤딩 + 드리프트 orb · "관리자 계정" 라벨 |
| `/` | `'use cache'` Static | navy 그라데이션 클래스 카드, 「어느 반을 담당하시나요?」 |
| `/operation/[section]` | Partial Prerender | 카드 헤더+카운트, KO/EN 토글 컬러, 검색되는 학생·교사 select |
| `/students` | `'use cache'` Static | stat anchor + 필터 카드 wrapper 제거 |
| `/teachers` | `'use cache'` Static | 동일 패턴 |
| `/books` | `'use cache'` Static | 동일 패턴 + KO/EN 컬러 탭(underline) + count chip 채움 |
| `/loans` | `'use cache'` Static | KPI 카드 (전체/연체/오늘 반납), inline 필터 |
| `/api/cron/midnight` | Dynamic | KST 자정 4태그 무효 (Bearer 검증) |
| `/icon`, `/opengraph-image` | Dynamic | next/og 동적 PNG (CDN 캐시) |

## 오늘(2026-05-19) 한 일 요약

### 반응형 작업 (밤 — 진행 중)

CLAUDE.md/SPEC 「데스크탑 우선 + 모바일 조회 가능」 목표.

**완료**:
- **사이드바 → 모바일 드로어**: `sidebar.tsx` 한 파일에서 `Sidebar`(데스크탑 고정, `hidden md:flex`) + `MobileNav`(햄버거 + `Sheet` 드로어) + 내부 공유 `SidebarBody` 컴포넌트로 분리. nav 항목 클릭 시 드로어 자동 닫힘.
- **PageHeader 햄버거**: 좌측에 `<MobileNav />` 추가, `md:hidden`으로 데스크탑에서 자동 숨김. `min-w-0 truncate`로 좁은 폭 안전. subtitle은 `hidden sm:block`.
- **테이블 가로 스크롤**: 4개 페이지(students/teachers/books/loans) 테이블 wrapper `overflow-hidden` → `overflow-x-auto`, 테이블에 `min-w-[N]` 적용해 모바일에서 가로 스크롤로 모든 컬럼 접근 가능.
- **페이지 padding**: 6개 main의 `px-6 py-8` → `px-4 py-6 md:px-6 md:py-8`.
- **AuthedLayout flex item `min-w-0`**: flex item이 콘텐츠 크기(테이블 min-w) 때문에 부모를 넓히는 문제. `min-w-0`로 shrink 허용 → 페이지 자체 가로 스크롤 해소, 테이블 내부에서만 스크롤.
- **책 페이지 액션 버튼**: 3개라 한 줄 폭이 큼 → `flex-wrap` 추가.

**남은 점검**:
- 실 디바이스(아이폰/안드로이드)·DevTools 다양한 폭에서 시각 확인
- operation 페이지(KO/EN 칼럼) 모바일에서 1칼럼씩 세로로 잘 쌓이는지
- Dialog/모달 (학생/책/교사 폼) 모바일에서 내용 잘리지 않는지
- KPI 카드(loans), 카드 그리드(home) 좁은 폭에서 가독성
- 모바일에서 검색·필터 row 줄바꿈 시 시각 정렬

### 디자인 · UX 통일 패스
- **로그인 페이지**: Great Vibes 폰트 + 드리프트 orb + 「관리자 계정」 라벨 + hairline subtitle
- **홈(/)**: navy 그라데이션 카드 + 큰 KPI 텍스트 + hover 부드러운 lift / "어느 반을 담당하시나요?"
- **operation 페이지**: PageHeader subtitle 제거, hero 헤더(섹션명 + inline 통계), KO/EN 컬러로 대여/반납 토글, 큰 바코드 스캔 인풋, 액티브 대여 리스트 정돈
- **students/teachers/books**: 동일 패턴 적용
  - PageHeader subtitle 제거
  - 본문 h2(중복) 제거
  - 카운트는 stat anchor(text-2xl + 작은 라벨)로 통일, 필터 시 「N / 전체 M」 표시
  - 액션 컬럼 헤더 비움
  - 필터 row 의 wrapper card 제거(이중 박스 해소)
- **books 탭**: KO/EN 컬러 underline + count chip(활성 시 채워짐) — `data-active:` attribute 정확히 사용
- **loans KPI**: 「연체」 빨강, 「오늘 반납 예정」 amber
- **language 라벨 통일**: "English Books" → "영어 도서" (LANGUAGE_LABEL.en.full)
- **드롭다운 사이트 일관**: Select/Combobox 패딩·hover·체크표시(primary 톤)·선택 항목 굵게
- **검색 가능한 select**: operation 페이지 학생·교사 선택을 Base UI Combobox로 교체 (이름·학년 부분 매칭 자동 필터)

### CSV/XLSX 업로드 강화
- **공통 컴포넌트**: `src/components/csv-format-guide.tsx`
- **헬퍼**: `src/lib/csv-template.ts` (downloadCsvTemplate, downloadXlsxTemplate, xlsxToCsv)
- 가로형 테이블 가이드 (라벨 + CSV 필드명 + 필수 표시 + choices chips)
- 「CSV」 「XLSX」 두 템플릿 다운로드 버튼
- XLSX 템플릿은 **셀별 드롭다운**(학년·반·언어 등 choices가 있는 컬럼)
- XLSX 업로드 지원 — 클라이언트에서 CSV로 자동 변환 후 서버 액션 호출
- **학생 중복 체크**: (이름+학년+반) 동일 행을 「이미 등록된 학생」으로 행 단위 실패 처리
- exceljs는 dynamic import — 메인 번들 무관

### 브랜드 자산
- `src/app/icon.tsx` — navy 그라데이션 64×64 favicon
- `src/app/opengraph-image.tsx` — 1200×630 OG (드리프트 orb 데코 + Library 아이콘 + "School Library" italic + "더힘스쿨 · 수지점")
- `src/constants/brand.ts` — BRAND_NAVY · BRAND_GRADIENT (두 이미지에서 공유)
- `layout.tsx` — Open Graph + Twitter Card metadata, `metadataBase` 자동 fallback (VERCEL_PROJECT_PRODUCTION_URL → VERCEL_URL → localhost)
- `proxy.ts` matcher 갱신: `/icon`, `/opengraph-image`, `/api/cron` 인증 게이트 제외 (카카오톡 크롤러·Vercel Cron 통과)
- **`public/branding/hims-logo.png`** — HIMS(Holy International Montessori School) 공식 학교 로고. **앞으로 학교 식별자(사이드바 상단, 로그인 헤더, favicon, OG 이미지 등)는 이 로고를 사용해 통일해야 함.** 현재 `더힘` 텍스트 배지는 임시 — 이 로고 기반으로 교체 작업 필요.

### 데이터 초기화
- DB의 students · teachers · books · loans · book_id_seq 모두 truncate/리셋
- Storage `book-covers` 비움
- `admin@thehim.school`(auth.users) 유지

### 검증 결과
- 카카오톡 미리보기: 「School Library / 더힘스쿨 수지점 · 도서 대여 관리」 + OG 이미지 — 정상 노출
- `/icon`, `/opengraph-image` curl → 200 OK image/png 확인
- 빌드 통과 (`◐`/`○`/`ƒ` 분류 안정)

## 박제 정책 (재확인)

- **DB는 데이터 저장 전용** — trigger·custom function 만들지 않음.
- **Server-only data flow** — 브라우저 클라이언트 X. 3개 Supabase 클라이언트(`server.ts`/`service.ts`/`session.ts`)만.
- **'use cache' 제약** — cookies/headers/searchParams 만지지 마라. 비결정적 값(`new Date()`)은 인자로.
- **Mutation 후 `updateTag(resource)`** — read-your-own-writes 보장.
- **Cron** — HTTP route + Bearer 검증. proxy.ts matcher에서 `api/cron` 제외 필수.
- **공개 이미지 라우트** — `icon`, `opengraph-image`도 proxy.ts matcher에서 제외 (크롤러 접근).

## Tag 매핑 (참고)

| 태그 | 무효 트리거 (updateTag) | 의존 쿼리 |
|---|---|---|
| `students` | student CRUD/CSV/XLSX | home, students, loans, operation |
| `books` | book CRUD/CSV/XLSX | students, books, loans, operation |
| `teachers` | teacher CRUD/CSV/XLSX | teachers, loans, operation |
| `loans` | lend/return | 모든 쿼리 |

## 다음 작업 후보

### 🔥 우선: 반응형 마무리
- [ ] 실 디바이스/DevTools 다양한 폭에서 시각 점검
- [ ] operation 페이지 모바일 카드 폭·내부 form 점검
- [ ] Dialog 모바일 내용 잘림 확인
- [ ] 검색·필터 행 wrap 시 정렬 정돈
- [ ] 필요하면 폰트 사이즈·아이콘 사이즈 모바일 축소(`text-3xl md:text-3xl` 패턴)

### 🔥 ROADMAP Phase 2 시작 후보
- [ ] **대여/반납 내역 관리 페이지** — 현재 `/loans`는 **활성 대여만** 표시. 반납 완료된 트랜잭션 히스토리(누가/언제/어떤 책을 빌리고 반납했는지)를 조회·필터(기간·학생·책·언어)·검색·CSV 내보내기 가능한 별도 페이지 필요. 운영팀이 반학기별·연간 통계를 요구할 때 baseline.
- [ ] **HIMS 로고 적용** — `public/branding/hims-logo.png`를 사이드바 상단, 로그인 헤더, favicon, OG 이미지로 통일. 현재 `더힘` 텍스트 배지 → 실제 학교 로고로 교체.
- [ ] **책 CSV/XLSX 양식·필드 확정 (운영팀/여친 협의)** — 현재 7컬럼이 실제 학교 운영에 맞는지 재검토
- [ ] 추세 통계 (인기 도서 Top N, 학년별 대여 빈도)
- [ ] 학년 진급 일괄 처리 / 6학년 졸업 처리
- [ ] 책·학생 일괄 작업 (다중 선택 → 일괄 변경)
- [ ] CSV Dialog · Delete Dialog 공통 컴포넌트 추출 (3중복 굳음 — 추상화 시점 도달)

### 🛠 정리 후보 (선택)
- [ ] Layout admin email 복구 (`process.env.ADMIN_EMAIL` 정적 주입, 캐시 안 깨짐)
- [ ] book-form-dialog 분해 (275줄, 표지 picker·언어 토글 sub로)

### 🌐 Phase 3 (장기)
- [ ] ISBN API → 책 정보·표지 자동 채우기
- [ ] 일괄 반납 (방학·졸업)
- [ ] CSV 백업·내보내기
- [ ] 연체 알림 (대여 상세 모달의 "알림 보내기")

## 환경 정보

| 항목 | 값 |
|---|---|
| Supabase project ref | `sxlxetjqhaszbzvxfcwu` (region `ap-northeast-2` Seoul) |
| Supabase URL | `https://sxlxetjqhaszbzvxfcwu.supabase.co` |
| GitHub repo | `https://github.com/tkdgns25300/school_library` |
| Vercel project | `school_library` (Hobby plan, Production = `main`, Function region `icn1`) |
| Production URL | `https://school-library-ten.vercel.app` |
| Admin 계정 | `admin@thehim.school` |
| Storage 버킷 | `book-covers` (public read, authenticated write) — 현재 비어있음 |
| Cron | `/api/cron/midnight`, KST 매일 00:00 (UTC 15:00) ± 1h Hobby window |

## .env 키 (5개)

```env
NEXT_PUBLIC_SUPABASE_URL=https://sxlxetjqhaszbzvxfcwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_EMAIL=admin@thehim.school
CRON_SECRET=<openssl rand -base64 32 결과>
```

Vercel 환경변수에 동일하게 설정돼있음.

## 새 PC 재개 절차

1. `git clone https://github.com/tkdgns25300/school_library`
2. `cd school_library && git checkout dev && npm install`
3. `.env` 복원 — 5개 키 모두. 1Password 등 보안 채널.
4. (AI 작업하려면) Supabase MCP 등록 — README "Supabase MCP" 섹션 참조
5. `npm run dev`로 띄우고 동작 확인
6. 다음 작업 후보(위) 중 선택해 진입

## 알려진 미세 사항

- Cron 실행 로그는 내일 아침 Vercel Dashboard → Crons → View Logs에서 확인 (200 OK + `{ ok: true, refreshed: [...] }` 응답 기대)
- Vercel Hobby cron flexibility — 정확히 KST 00:00이 아니라 00:00~01:00 사이 어딘가
- favicon이 `ƒ` Dynamic 분류지만 Vercel CDN이 응답 캐시 (실 영향 미미)
- Book CSV 7컬럼은 임시안 — 운영팀과 확정 후 Phase 2 작업
