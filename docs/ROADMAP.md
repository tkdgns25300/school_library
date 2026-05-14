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

### 마무리 (남은 작업)

Phase 1 진입 전제조건. 검증 기준: **로그인 후 빈 운영 페이지(반 카드 3개) 진입까지 동작**.

- [ ] Supabase 클라이언트 — `src/lib/supabase/{client,server}.ts` (`@supabase/ssr`: 브라우저용 / 서버 컴포넌트·Server Actions용 / 미들웨어 세션 갱신 헬퍼)
- [ ] DB 타입 — `src/types/database.ts` (Supabase MCP 또는 CLI 자동 생성)
- [ ] 인증 미들웨어 — `src/middleware.ts` (비인증 시 `/login` 리다이렉트, 세션 자동 갱신)
- [ ] 로그인 페이지 — `src/app/login/page.tsx` (이메일/비밀번호 폼)
- [ ] 글로벌 레이아웃 — `src/app/layout.tsx` + `src/components/layout/` (사이드바 2그룹 "운영"·"관리" + 접기 토글, 헤더 페이지명·서브타이틀·우측 오늘 날짜, 관리자 계정 박스, 로그아웃)

## Phase 1: MVP — 5페이지

> 각 페이지 동작은 SPEC.md 참조. 여기는 작업 단위 체크리스트.

### 1-1. 공통 골격

- [ ] 도메인 타입 (`src/types/domain.ts`)
- [ ] 정렬 헬퍼 (`src/lib/sort/`) — SPEC 정렬 규칙 표 구현
- [ ] 컬러 토큰 (한국어=남색, 영어=초록) 상수화

### 1-2. 학생 명단 (SPEC: 학생 명단)

- [ ] 목록 (학년 ↑ → 반 → 이름)
- [ ] 한국어 (대여/연체), 영어 (대여/연체) 컬럼 (집계 쿼리)
- [ ] 검색·필터 (이름·학년·반)
- [ ] 추가/수정/삭제 UI
- [ ] CSV 업로드 + 검증 리포트

### 1-3. 교사 명단 (SPEC: 교사 명단)

- [ ] 목록 (이름·담당 반)
- [ ] 추가/수정/삭제 UI
- [ ] CSV 업로드

### 1-4. 책 목록 (SPEC: 책 목록)

- [ ] 한/영 탭 + 권수 표시
- [ ] 상태 토글 (전체 / 대여 가능 / 대여 중)
- [ ] 검색·필터 (제목·저자·단계, 단계 드롭다운)
- [ ] 추가 폼 (자동 ID + 바코드 미리보기 + 표지 파일 업로드 → Storage)
- [ ] 수정/삭제 UI (삭제 시 Storage 객체 정리)
- [ ] CSV 업로드 (바코드 자동 발급)
- [ ] 다중 선택 → A4 라벨 PDF 출력

### 1-5. 운영 (SPEC: 운영)

- [ ] 반 선택 화면 (카드 3개 + 학생·대여·연체 KPI)
- [ ] 반별 운영 화면 — 상단 KPI + 한·영 1:1 두 칼럼
  - [ ] 칼럼 헤더 (권수·연체)
  - [ ] 대여/반납 모드 토글
  - [ ] 학생 + 반납 예정일 + 담당 교사 선택
  - [ ] 바코드 입력 (자동 포커스, 연속 스캔, 스캔 시 표지 미리보기)
  - [ ] 잘못된 칸 안내 토스트
  - [ ] 대여 중 리스트 (연체 먼저 → 학년 ↑ → 이름)
- [ ] 활성 대여 없는 책 반납 시도 / 이미 대여 중인 책 대여 시도 경고

### 1-6. 대여 현황 (SPEC: 대여 현황)

- [ ] KPI 카드 3개 (전체 대여 중 / 연체 + 최장 일수 / 오늘 반납 예정)
- [ ] 검색 (학생·책·바코드) + 언어 토글 + 반 드롭다운
- [ ] 활성 대여 행 (책 표지 썸네일 + 학년·반·학생·책·언어·반납 예정·상태)
- [ ] 정렬 (연체 먼저 → 학년 ↑ → 반납 예정일 ↑)
- [ ] 행 클릭 → 대여 상세 모달 (반납 처리)

## Phase 2: 운영 편의

- [ ] 추세 통계 (인기 도서 Top N, 학년별 대여 빈도)
- [ ] 학년 진급 일괄 처리 / 6학년 졸업 처리
- [ ] 책·학생 일괄 작업

## Phase 3: 선택

- [ ] ISBN API → 책 정보·표지 자동 채우기
- [ ] 일괄 반납 (방학·졸업)
- [ ] CSV 백업·내보내기
- [ ] 연체 알림 (대여 상세 모달의 "알림 보내기")
