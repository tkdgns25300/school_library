# School Library — 작업 로드맵

> 페이지·기능 명세는 [`SPEC.md`](./SPEC.md), DB는 [`SCHEMA.md`](./SCHEMA.md).
> 브랜치: `main` / `dev`. 작업은 dev에서. commit·push·merge는 사용자 명시 요청 시에만.

## Phase 0: 프로젝트 준비

- [x] GitHub repo 생성 + clone
- [x] CLAUDE.md, docs/* 작성
- [x] README.md, .gitignore, .env.example
- [x] `dev` 브랜치 생성, dev에서 작업
- [x] Next.js 16 + React 19 + Tailwind v4 + TypeScript strict 셋업
- [x] shadcn/ui (base-nova / Base UI / neutral) + 컴포넌트 22개
- [x] 라이브러리: `bwip-js`, `papaparse`, `pdf-lib`, `@types/papaparse`
- [ ] Supabase 프로젝트 생성 (대시보드)
- [ ] 마이그레이션 SQL (`supabase/migrations/001_init.sql`) — 4테이블 + 시퀀스 + 인덱스 + RLS
- [ ] Supabase 클라이언트 (`src/lib/supabase/{client,server}.ts`)
- [ ] `.env.local` 채우기
- [ ] 관리자 계정 생성 (Supabase 대시보드)
- [ ] 로그인 페이지 + 인증 미들웨어
- [ ] Vercel 연동

## Phase 1: MVP — 5페이지

> 각 페이지의 동작은 SPEC.md 1-N 참조. 여기는 작업 단위 체크리스트.

### 1-1. 공통 골격

- [ ] 사이드바 네비게이션 (5페이지)
- [ ] 헤더 (로그아웃)
- [ ] 도메인 타입 정의 (`src/types/domain.ts`)
- [ ] 정렬 헬퍼 (`src/lib/sort/`) — SPEC 정렬 규칙 표 구현
- [ ] 컬러 토큰 (한국어=남색, 영어=초록) 상수화

### 1-2. 학생 명단 (SPEC: 학생 명단)

- [ ] 목록 페이지 (정렬·검색·필터)
- [ ] 추가/수정/삭제 UI
- [ ] CSV 업로드 + 검증 리포트

### 1-3. 교사 명단 (SPEC: 교사 명단)

- [ ] 목록 페이지
- [ ] 추가/수정/삭제 UI
- [ ] CSV 업로드

### 1-4. 책 목록 (SPEC: 책 목록)

- [ ] 한/영 탭 + 표지 썸네일 + 큰 미리보기
- [ ] 필터·검색 (학년, 언어, 단계/레벨)
- [ ] 추가 폼 (자동 ID + 바코드 미리보기)
- [ ] 수정/삭제 UI
- [ ] CSV 업로드 (바코드 자동 발급)
- [ ] 다중 선택 → A4 라벨 PDF 출력

### 1-5. 운영 (SPEC: 운영)

- [ ] 반 선택 화면 (카드 3개)
- [ ] 반별 운영 화면 — 한·영 1:1 두 칼럼
  - [ ] 헤더 (권수·연체)
  - [ ] 대여/반납 모드 토글
  - [ ] 학생 + 반납 예정일 + 담당 교사 선택
  - [ ] 바코드 입력 (자동 포커스, 연속 스캔)
  - [ ] 책 표지 즉시 미리보기
  - [ ] 잘못된 칸 안내 토스트
  - [ ] 대여 중 리스트 (연체 먼저 → 학년 ↑)
- [ ] 활성 대여 없는 책 반납 시도 / 이미 대여 중인 책 대여 시도 경고

### 1-6. 전체 통계 (SPEC: 전체 통계)

- [ ] 반별 뷰 + 전체 뷰 (탭)
- [ ] 한·영 구분 표시
- [ ] 학생 정렬 (연체 먼저 → 학년 ↑)

## Phase 2: 운영 편의

- [ ] 대시보드 요약 (오늘 대여/반납 수, 연체 수, 미인쇄 책 수 등)
- [ ] 추세 통계 (인기 도서 Top N, 학년별 대여 빈도)
- [ ] 학년 진급 일괄 처리 / 6학년 졸업 처리
- [ ] 책·학생 일괄 작업

## Phase 3: 선택

- [ ] ISBN API → 책 정보·표지 자동 채우기
- [ ] 일괄 반납 (방학·졸업)
- [ ] CSV 백업·내보내기
- [ ] 연체 알림
- [ ] 표지 이미지 Supabase Storage 마이그레이션
