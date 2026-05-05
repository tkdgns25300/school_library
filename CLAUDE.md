# CLAUDE.md — School Library

## Project

더힘스쿨 수지점(기독교 대안학교, 1~6학년, ~300권)의 도서 대여 관리 웹앱. 기존 "르네상스" 시스템 대체.

- **Stack**: Next.js 14+ (App Router) · TypeScript strict · Tailwind + shadcn/ui · Supabase (Postgres + Auth) · Vercel · npm
- **사용자 모델**: 교사 다수가 사용. 단일 관리자 계정으로 공용 로그인. 대여/반납 시 담당자(교사) 지정.

## Architecture

**레이어**:
```
app/         라우트와 페이지 컴포지션 (얇게)
components/  순수 UI (도메인 로직 없음)
hooks/       클라이언트 상태/이벤트 (스캐너 입력 등)
lib/         비즈니스 로직, Supabase 클라이언트, 바코드/CSV/PDF 헬퍼
types/       공유 타입 (database.ts, domain.ts)
```

**원칙**:
- **서버 컴포넌트 기본**, 클라이언트 컴포넌트는 입력/이벤트가 필수일 때만 (`"use client"` 명시)
- **데이터 변경은 Server Actions**로 (REST API 라우트 남발 금지)
- **DB 접근은 lib/supabase**를 통해서만 (컴포넌트가 직접 supabase-js 호출 X)
- **도메인 타입은 types/에**, DB 응답은 `Database` 타입에서 파생

## Directory Structure

```
src/
├── app/          페이지 (page.tsx, layout.tsx, route handlers)
├── components/   재사용 UI
├── constants/    상수 (학년, 반 종류, 바코드 prefix 등)
├── hooks/        클라이언트 훅
├── lib/          supabase/, barcode/, csv/, pdf/, utils/
└── types/        database.ts (Supabase 생성), domain.ts (도메인 타입)

supabase/migrations/   DB 마이그레이션 SQL
docs/                  SPEC.md / SCHEMA.md / ROADMAP.md
```

폴더·파일명은 **영어 kebab-case**. 컴포넌트 파일도 `book-card.tsx` 형태.

## Clean Code Principles

- **단일 책임**: 한 함수/컴포넌트는 한 가지 일만. 60줄 넘으면 분해 검토.
- **명명이 곧 문서**: 의도가 드러나는 이름. 주석은 *왜*가 필요할 때만, *무엇*은 코드가 말하게.
- **죽은 코드 즉시 삭제**: 미사용 import/변수/함수, 주석 처리한 코드 남기지 않음.
- **매직 값 금지**: 숫자/문자 리터럴은 `constants/`에. 학년 1~6, 반 종류, 바코드 prefix 등.
- **에러는 경계에서만 처리**: 사용자 입력·외부 API 경계에서. 내부 호출에 방어 코드 남발 X.
- **타입으로 잘못된 상태를 표현 불가능하게**: `any` 금지. union/literal로 좁혀라. 외부 데이터는 반드시 타입 명시.
- **추상화는 3번째에**: 한두 번 비슷한 코드는 그대로 둬도 됨. 패턴이 굳어지면 그때 추출.

## Code Conventions

**Naming**
- 파일/폴더: `kebab-case.tsx`
- 컴포넌트/타입: `PascalCase` (`BookCard`, `Loan`) — `I` prefix 금지
- 함수/변수: `camelCase` (`getActiveLoans`)
- 상수: `UPPER_SNAKE_CASE` (`MAX_GRADE`, `BARCODE_PREFIX`)
- Boolean: `is/has/should` 접두사

**TypeScript**
- `any` 금지. 불가피하면 `unknown` + 타입 가드.
- 공유 타입은 `types/`, 한 파일 내 전용 타입은 파일 상단.

**React/Next.js**
- 컴포넌트는 함수 선언문: `export default function Component()`
- 페이지(`app/`)는 조합만. 로직은 `components/`·`lib/`로 분리.
- `useEffect` 최소화. 서버 컴포넌트나 핸들러로 대체 가능한지 먼저 검토.

**Styling**
- Tailwind 인라인. 별도 CSS X (`globals.css` 제외).
- shadcn/ui 우선. 커스텀은 필요할 때만.
- 모바일 퍼스트지만 **기본 사용 환경은 데스크탑**(교사 PC + USB 스캐너).

**Imports**
- 항상 `@/` alias. 상대 경로는 같은 폴더 내에서만.

**소통/커밋**
- 사용자와 소통은 한국어, 커밋 메시지는 영어 (동사 원형: Add/Fix/Update/Remove).
- 1 커밋 = 1 논리적 변경.

## Domain Notes

**바코드 발급**: `bwip-js` Code128. 책 ID는 `BK00001`~ (PostgreSQL 시퀀스). 등록 시 자동 발급, 라벨 PDF 인쇄 후 `printed=true`.

**바코드 스캔**: USB 스캐너는 키보드 에뮬레이션. `<input>` 자동 포커스 + `onKeyDown`에서 Enter 감지로 처리. 별도 드라이버/API 없음.

**인증**: Supabase Auth 이메일/비밀번호 단일 관리자 계정. 회원가입 UI 없음(대시보드에서 생성). 미들웨어로 비인증 시 `/login` 리다이렉트.

**담당자**: 다수 교사가 같은 관리자 계정으로 로그인. 대여/반납 시 `teachers` 테이블에서 담당자를 dropdown으로 선택 → `loans.handled_by_teacher_id`에 기록.

**반(class_section)**: `junior 1` / `junior 2` / `senior 1` 3종.
- 1~3학년 → `junior 1` 또는 `junior 2`
- 4~6학년 → `senior 1`
- 학생 등록 시 grade와 class_section 둘 다 필수.

**데이터 입력**: 학생/책/교사 모두 (1) CSV 일괄 업로드, (2) UI 개별 CRUD 두 경로 지원.

## Git Workflow

- **브랜치**: `main`(배포) / `dev`(개발). feature 브랜치 X. 작업은 항상 `dev`에서.
- **commit / push / merge는 사용자가 명시적으로 요청할 때만 수행한다.** 작업 완료 후 자동 커밋 금지.
- 사용자 요청 시: 영어 커밋 메시지, 동사 원형으로 시작.

## Quality Checklist

코드 작성 후 확인:
1. `npm run build` 통과
2. 미사용 import/변수 없음
3. `any` 없음
4. 단일 책임 지킴
5. 네이밍만으로 역할 이해 가능
