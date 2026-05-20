# Snapshot — 2026-05-20 (HIMS 로고 통일 + 대여 내역 페이지 신규)

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).

## 현재 위치

Phase 1(기능 5페이지) + Phase 1.5(캐시 인프라) + 운영 페이지 정비 + **HIMS 로고 전 surface 적용** + **Phase 2 첫 작업: `/loans/history` 대여 내역 페이지** 완료. 데이터는 admin 계정만.

**다음**: Phase 2 — 엑셀+AI 책 가져오기 (꿈의 학교 인증도서 매칭), 추세 통계, 일괄 작업 (아래 후보 참조).

**최신 main 커밋**: `67516e7` (사이드바 헤더 → `/` 링크). 이전 시리즈: `27ffb75` /loans/history · `762158c` HIMS 로고 · `f6dd5bb` barcode 정리.

| 라우트 | 모드 | 비고 |
|---|---|---|
| `/login` | Static | Great Vibes 헤딩 + HIMS 방패 hero + 드리프트 orb |
| `/` | `'use cache'` Static | navy 그라데이션 클래스 카드, 「어느 반을 담당하시나요?」 |
| `/operation/[section]` | Partial Prerender | KO/EN tint 헤더 + 대여/반납 full-width 탭 + 학년 chip picker + readOnly 바코드 input(IME 우회) + 인라인 반납 버튼 |
| `/students` | `'use cache'` Static | stat anchor + 필터 카드 wrapper 제거 |
| `/teachers` | `'use cache'` Static | 동일 패턴 |
| `/books` | `'use cache'` Static | KO/EN 컬러 탭(underline) + count chip 채움 |
| `/loans` | `'use cache'` Static | KPI 카드 (전체/연체/오늘 반납), inline 필터 |
| `/loans/history` | `'use cache'` Static | **신규** — 반납 완료 거래 조회. 기간 프리셋+커스텀 범위(range Calendar) · 검색 · 언어 · 반 필터. 연체 반납 배지 |
| `/api/cron/midnight` | Dynamic | KST 자정 4태그 무효 (Bearer 검증) |
| `/icon.png` | Static | HIMS 방패 64×64 정적 favicon |
| `/opengraph-image` | Dynamic | next/og 동적 PNG, 방패 임베드(fs.readFile data URL) |

## 오늘(2026-05-20) 한 일 요약

### Phase 2 첫 작업 — `/loans/history` 대여 내역 페이지

- 신규: `src/lib/queries/loan-history.ts` (`getLoanHistory()`, `returned_at NOT NULL` + `returned_at DESC` SQL order)
- 신규: `src/app/(authed)/loans/history/{page,history-view}.tsx`
- 사이드바 운영 그룹에 「대여 내역」 항목 추가 (`ClipboardList` 아이콘)
- 캐시: `'use cache' + cacheTag("loans", "students", "books") + cacheLife("days")` — `/loans`와 동일 의존. lend/return → `updateTag("loans")` 이미 있어 자동 무효.
- UI 1차 → **검토 후 재정비**: 필터 row가 9개 컨트롤로 빽빽해서 **기간을 단일 Popover 버튼**으로 압축(왼쪽 5 프리셋 라디오 + 오른쪽 Calendar `mode="range"`). 연체 「반납 일」 옆이 아닌 **반납일 셀 안 inline 배지**로 흡수. 학년·반 별도 컬럼 제거, **학생 셀에 subtitle로 흡수**(책 셀 리듬과 통일).
- 최종 테이블 **6컬럼**: 표지 / 학생(name + grade·section sub) / 책 / 언어 / 대여일 / 반납일(연체 inline). `min-w-[780px]`.
- 코드 정리 3건: ① `overdueDays(due, returnedDate)` 헬퍼 재사용(매직 86_400_000 제거), ② `customRange.from!` 비-null 단언 4회 → destructure로 자연 narrow, ③ 단일 일자 클릭 시 라벨↔필터 불일치 fix(`to` 미지정이면 `from`을 `to`로 fallback).
- 정렬: `returned_at DESC` 고정 (UI 토글 없음). CSV 내보내기는 Phase 2 후반 작업으로 분리.

### 사이드바 헤더 → 홈 링크

- HIMS 방패 + School Library 헤더가 정적 `<div>`였음 → `<Link href="/">`로 교체. 모바일 드로어에서는 `onNavigate` 호출로 Sheet 자동 닫힘. 접힘 모드에선 `title="대여 데스크"` 툴팁. hover에 `bg-sidebar-accent/40`.

### HIMS 로고 전 surface 적용 (낮)

- 원본 `hims-logo.png`를 3종 PNG로 자동 분리: `hims-shield.png`(방패 단독) · `hims-mark.png`(방패+부제) · `hims-lockup.png`(가로 lockup). Python+Pillow로 bbox 자동 검출 후 crop.
- 사이드바: `더힘` 텍스트 배지 → `hims-shield.png` (`size-9 object-contain`). expanded/collapsed/mobile drawer 공유.
- 로그인: 그라데이션 박스 + Library 아이콘 → `hims-shield.png` (`size-24`). Great Vibes "School Library" 헤딩 유지.
- favicon: 동적 `icon.tsx` 제거 → 정적 `src/app/icon.png` (방패 64×64). `ƒ /icon` → `○ /icon.png`로 분류 개선.
- OG 이미지: Library SVG → 방패 PNG 임베드(`fs.readFile` + base64 data URL).
- proxy.ts matcher에서 `icon` literal 제거 (`.png$` 패턴이 대신 잡음).
- **전 authed 페이지 백그라운드 워터마크**: `(authed)/layout.tsx`에 `sticky top-0` + `-mb-[100vh]` 패턴으로 viewport 중앙 고정. 사이드바 영향 X (컬럼 안에서 갇힘). opacity 0.07. `bg-muted/30` main을 투과해 옅게 보이고, 솔리드 PageHeader·bg-card는 가림.
- 로그인은 (authed) 밖이라 워터마크 제외, 자체 hero treatment.

### 정리 (아침)
- `lib/barcode.ts` — `normalizeBarcodeInput` + `HANGUL_JAMO_TO_LATIN` 매핑 삭제. IME 우회가 readOnly + `e.code` 캡쳐로 바뀐 뒤 호출처 없음. `generateBarcodePng`만 남음.
- SNAPSHOT 헤더 「최신 main 커밋」 갱신.

## 어제(2026-05-19) 한 일 요약

### 운영 페이지 대대적 정비 (늦은 밤 — 완료)

여친·운영 측 피드백으로 대여 데스크가 크게 바뀜.

**도메인 변경**
- **담당 교사 추적 완전 제거** — `loans.handled_by_teacher_id` / `loans.returned_by_teacher_id` 컬럼 둘 다 drop (migration `003_drop_loans_teacher_ids.sql`). 운영 흐름에서 누가 처리했는지 트래킹할 가치가 약했고, 학생 picker도 잘못 선택 시 다른 사람 책을 반납하는 버그를 만들어서. `teachers` 테이블은 명단용으로 유지.
- **반납 모드 학생 picker 자체 X** — 책 바코드로 active loan 조회 → DB가 borrower 식별. server action 결과에 `borrower: { name, grade }` 포함시켜 toast로 표시.

**대여 데스크 UI 재구성**
- 카드 헤더에 KO/EN gradient tint, 그 아래 대여/반납 **full-width 탭 bar**(underline 강조). 작은 inline 버튼 모양은 폐기.
- 학생 picker: combobox → **학년 탭 + 학생 chip grid**. 학년별 학생 수 pill, 한 클릭으로 학생 선택. 반납 모드에서는 picker 자체 렌더 X.
- 스캔 모달: 단순화 (`바코드를 스캔하세요` 한 줄 + 큰 vermilion 아이콘 + ping 애니메이션). 성공 시 모달 자동 닫힘 + toast `학년 학생 — '책' 대여/반납 완료`. 실패 시 모달 유지(`✗` + 메시지 + 1.5초 후 ready로 복귀)로 재시도 자연스러움.
- **활성 대여 리스트에 행별 [반납] 버튼** (반납 모드만) — 스캐너 없이 클릭 한 번으로 반납 처리. 연체 표시는 학생 이름 옆 inline `+N일 연체`로 이동.
- ScannedBookPreview 카드 **제거** — toast + 활성 대여 리스트가 이미 같은 정보 충분히 제공. 정보 중복이라 노이즈.

**한글 IME 바코드 버그 → readOnly + e.code 캡쳐**
- 처음엔 `normalizeBarcodeInput`(자모 → 영문 매핑) + setBarcode("") 로 시도했지만, IME가 'B'(=ㅠ)·'K'(=ㅏ)를 유효 음절로 합성 못 하면 **silent cancel** → `BK00001`이 `00001`로 들어옴. 또 직전 잔여로 `BBK00001`도 발생.
- 최종: 입력을 `readOnly` + `onKeyDown`에서 `e.code` (KeyA-Z, Digit0-9, Numpad0-9)로 raw key 캡쳐. IME 상태 무관. modifier 조합 통과, Backspace/Enter 별도 처리.

**사이드바 잘림 fix**
- 일시적 가로 overflow 시 사이드바가 viewport 좌측 밖으로 밀려나는 증상.
- `(authed)/layout.tsx`에 `overflow-x-clip` + `sidebar.tsx`에 `md:sticky md:top-0`. clip을 쓴 건 자식 sticky를 깨지 않기 위함.

**자잘한 정리**
- 학생 명단 KO/EN 컬럼 라벨을 **"한국어 도서 대여 수" / "영어 도서 대여 수"**로 명확화 (이름 컬럼인 줄 오해 방지).
- 책 표지 셀의 KO/EN bg가 이미지 주위로 노출되던 `p-1`/`gap-0.5` 제거 — fallback(이미지 없을 때)에만 적용.
- 교사 명단 max-w 시도 → 다시 풀고 학생과 동일 패턴으로 통일.

**코드 정리**
- `overdueDays()` 두 곳 중복(operation·loans) → `lib/date.ts`로 단일화. 이전엔 한쪽이 `Math.max(0, …)` 다른 쪽이 `Math.floor(…)` (음수 가능). 단일 구현: `dueDate >= today` 가드 + `floor((today−due)/86_400_000)`.
- `BookWithStatus.language: string` → `Language` 리터럴 타입으로 좁힘. queries 경계에서 한 번 cast, view 안의 `as Language` 캐스트 제거.

**보류 (감사 결과)**
- `Student` 타입 통합(queries/operation.ts vs queries/students.ts) — stats 유무로 다르고 통합 가치 약해 그대로.
- language-column.tsx 781줄 — 응집도 높음(모두 운영 데스크 UI). 분해 보류 OK.

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
- [ ] **엑셀 + "꿈의 학교" 인증도서 → AI 자동 책 가져오기** ⭐
  - 여친이 학교에서 받은 **엑셀 파일**에 도서관 책 목록(제목·저자 등 기본 정보)이 있음. 이 책들을 `books` 테이블에 일괄 등록해야 함.
  - 책의 상세 정보(표지 이미지·정확한 저자·출판사·언어·레벨 등)는 **"꿈의 학교"** 사이트 ([꿈의학교 인증도서 검색](https://www.ggumschool.co.kr/) — 정확한 URL은 작업 시 확인) 의 **인증도서 찾기** 검색으로 가져옴.
  - **AI(Claude API 또는 비슷한 LLM)** 를 통해 엑셀 row 단위로:
    1. 엑셀에서 한 행 읽음
    2. 꿈의 학교에서 책 검색 (web fetch + parse, 또는 LLM agentic browse)
    3. 검색 결과 중 가장 매칭되는 책 선정 (제목·저자 유사도)
    4. 표지 이미지 URL 추출 → Supabase Storage `book-covers`에 다운로드 → public URL 저장
    5. `books` insert (`BK00001` 시퀀스 그대로 사용)
  - 구현 옵션:
    - (a) 별도 Node.js 스크립트 (`scripts/import-books.ts`) — 1회성 import
    - (b) Server action + 진행률 UI — 운영자가 직접 업로드/실행
  - **현재 정해진 것 없음** — 작업 시 엑셀 양식 + 꿈의 학교 검색 UI 분석부터.
- [x] ~~**대여/반납 내역 관리 페이지**~~ — 2026-05-20 완료 (`/loans/history`). CSV 내보내기만 별도 후속.
- [x] ~~**HIMS 로고 적용**~~ — 2026-05-20 완료 (방패 PNG 3종 분리 → 사이드바·로그인·favicon·OG·전 authed 워터마크 통일).
- [ ] **`/loans/history` CSV 내보내기** — 학기·연간 보고서용. 필터된 결과를 그대로 CSV로.
- [ ] **책 CSV/XLSX 양식·필드 확정 (운영팀/여친 협의)** — 현재 6컬럼이 실제 학교 운영에 맞는지 재검토 (위 AI 가져오기와 통합 가능)
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
