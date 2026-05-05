# School Library — 작업 로드맵

> 브랜치: `main` / `dev` 2개. 작업은 `dev`에서. commit·push·merge는 사용자 명시 요청 시에만.

## Phase 0: 프로젝트 준비

- [x] GitHub repo 생성 + clone
- [x] CLAUDE.md, docs/SPEC.md, docs/SCHEMA.md, docs/ROADMAP.md 작성
- [x] README.md, .gitignore, .env.example 작성
- [ ] `dev` 브랜치 생성 + 작업 시작
- [ ] Next.js App Router + TypeScript strict + Tailwind 셋업
- [ ] shadcn/ui 초기화 (Button, Input, Form, Table, Dialog, DatePicker, Combobox 등)
- [ ] 라이브러리 설치: `bwip-js`, `papaparse`(CSV), `pdf-lib` 또는 `@react-pdf/renderer`
- [ ] Supabase 프로젝트 생성
- [ ] 마이그레이션 SQL 작성 (`supabase/migrations/001_init.sql`)
  - [ ] `teachers`, `students`, `books`, `loans` 테이블 + CHECK 제약
  - [ ] `book_id_seq` 시퀀스 + `generate_book_id()` 함수
  - [ ] 인덱스 (printed, active loan, overdue, student/class)
  - [ ] RLS 정책 (authenticated 전체 허용)
- [ ] Supabase 클라이언트 설정 (`src/lib/supabase/{client,server}.ts`)
- [ ] 환경변수 설정 (`.env.local`)
- [ ] 관리자 계정 1개 Supabase 대시보드에서 생성
- [ ] 로그인 페이지 + 인증 미들웨어
- [ ] Vercel 연동

## Phase 1: MVP

> 목표: 교사가 로그인해서 학생/책을 등록하고, 라벨을 인쇄하고, 대여·반납을 처리하고, 반별로 대여·연체를 모니터링한다.

### 공통
- [ ] 사이드바 네비 (대시보드 / 교사 / 학생 / 책 / 대여·반납 / 모니터링)
- [ ] 헤더 (로그아웃)

### 교사 관리
- [ ] 교사 목록 + 추가/수정/삭제
- [ ] 교사 CSV 업로드

### 학생 관리
- [ ] 학생 목록 (이름 검색, 학년·반 필터)
- [ ] 학생 추가/수정/삭제 (학년·반 조합 검증)
- [ ] 학생 CSV 업로드 + 검증 리포트

### 책 관리
- [ ] 책 목록 (제목/저자 검색, 학년/미인쇄/대여중 필터)
- [ ] 책 추가 (자동 ID + 바코드 미리보기)
- [ ] 책 수정/삭제 (활성 대여 있으면 삭제 차단)
- [ ] 책 CSV 업로드 + 검증 리포트
- [ ] 바코드 라벨 PDF 출력 (미인쇄 책 일괄 → 인쇄 후 `printed=true` 일괄 처리)

### 대여·반납
- [ ] `/checkout` 페이지
- [ ] 모드 선택 (대여 / 반납)
- [ ] 담당자(교사) 선택
- [ ] 대여 모드: 학생 선택 + 반납 예정일
- [ ] 반납 모드: 학생 선택 불필요
- [ ] 바코드 입력 자동 포커스, Enter 감지, 연속 스캔
- [ ] 활성 대여 없는 책 반납 시도 → 경고
- [ ] 이미 대여 중인 책 대여 시도 → 경고

### 모니터링
- [ ] **반별 뷰**: 반 클릭 → 학생 목록 → 학생별 (대여 권수, 연체 권수)
- [ ] **연체 도서 리스트**: 연체일 정렬, 학생·반·담당자 표시
- [ ] **현재 대여 중 도서 리스트**: 검색·필터

## Phase 2: 운영 편의

- [ ] 대시보드 (오늘 대여/반납 수, 연체 카운트, 미인쇄 책 수, 최근 활동)
- [ ] 인기 도서 Top N, 학년별 대여 빈도 (추세 통계)
- [ ] 학년 진급 일괄 처리 (1→2 등)
- [ ] 6학년 졸업 처리
- [ ] 책 일괄 작업 (학년 변경, 일괄 삭제)

## Phase 3: 선택 기능

- [ ] ISBN API (네이버/알라딘) → 책 정보 자동 채우기
- [ ] 일괄 반납 (방학·졸업)
- [ ] CSV 백업/내보내기 (학생/책/대여 이력)
- [ ] 연체 알림 (이메일 등)

## Git 운영

- 브랜치: `main`(배포), `dev`(작업)
- 커밋 메시지: 영어, 동사 원형 (Add/Fix/Update/Remove)
- commit·push·merge는 사용자가 명시적으로 요청할 때만
