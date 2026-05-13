# Snapshot — 2026-05-14

> 현재 프로젝트 상태와 다음 작업의 단일 진실 소스.
> **다른 환경(PC·AI)에서 작업을 이어갈 때 이 문서를 가장 먼저 읽는다.**

## 프로젝트 한 줄

더힘스쿨 수지점(기독교 대안학교, 1~6학년) 도서 대여 관리 웹앱. Next.js 16 + Supabase + Vercel.

## 읽는 순서

1. **이 파일 (SNAPSHOT.md)** — 현재 상태·다음 작업
2. **[`CLAUDE.md`](../CLAUDE.md)** — 코딩 컨벤션·아키텍처·도메인 규칙
3. **[`docs/SPEC.md`](./SPEC.md)** — 페이지·기능 명세
4. **[`docs/SCHEMA.md`](./SCHEMA.md)** — DB 스키마·Storage·SQL 패턴
5. **[`docs/ROADMAP.md`](./ROADMAP.md)** — Phase별 체크리스트

## 진행 상황 (2026-05-14 기준)

### ✅ 완료
- GitHub repo + `main`/`dev` 브랜치, 작업은 dev에서
- 도메인 docs 5종 (CLAUDE/SPEC/SCHEMA/ROADMAP/README) 정리 완료
- Next.js 16 + React 19 + Tailwind v4 + TypeScript strict 셋업
- shadcn/ui (`base-nova` / Base UI / neutral) — 22개 컴포넌트 + `field`
- 라이브러리: `bwip-js`, `papaparse`, `pdf-lib`, `@types/papaparse`
- Supabase 프로젝트 생성 (`lwjzyuxjwdeolmsmmmhi`)
- 마이그레이션 `supabase/migrations/001_init.sql` 적용 완료 — 4 테이블 + 시퀀스 + 인덱스 + RLS + Storage 버킷
- 관리자 계정 `admin@thehim.school` 생성
- `.env` 로컬 셋업 (gitignored)
- Vercel 연결 + 첫 배포 (Production = `main`)

**최신 커밋**: `49b32fb` (dev = main 동기화)

### 🟡 진행 예정 (Phase 0 마무리)

1. **Supabase 클라이언트** — `src/lib/supabase/{client,server}.ts`
   - 브라우저용 / 서버 컴포넌트·Server Actions용 / 미들웨어 세션 갱신 헬퍼
   - `@supabase/ssr` 사용
2. **DB 타입** — `src/types/database.ts`
   - MCP 또는 Supabase CLI로 자동 생성 권장. 미설정 시 수동 작성.
3. **인증 미들웨어** — `src/middleware.ts`
   - 비인증 시 `/login` 리다이렉트, 세션 자동 갱신
4. **로그인 페이지** — `src/app/login/page.tsx`
   - 이메일/비밀번호 폼 (shadcn `field` + `input` + `button`)
5. **글로벌 레이아웃** — `src/app/layout.tsx` + `src/components/layout/`
   - 사이드바 (운영 그룹: 운영·대여 현황 / 관리 그룹: 학생·책·교사) + 접기 토글
   - 헤더 (페이지명·서브타이틀 + 우측 오늘 날짜)

**Phase 0 마무리 검증 기준**: 로그인 후 빈 운영 페이지(반 카드 3개) 진입까지 동작.

### ⚪ Phase 1 (이후)

5페이지 골격 + CRUD + CSV + 표지 업로드 + 라벨 PDF. ROADMAP.md 참조.

## 환경 정보

| 항목 | 값 |
|---|---|
| Supabase project ref | `lwjzyuxjwdeolmsmmmhi` |
| Supabase URL | `https://lwjzyuxjwdeolmsmmmhi.supabase.co` |
| GitHub repo | `https://github.com/tkdgns25300/school_library` |
| Vercel project | `school_library` (production branch: `main`) |
| Admin account | `admin@thehim.school` (비번은 별도 보관) |
| Storage 버킷 | `book-covers` (public read, authenticated write) |

## 새 PC에서 작업 재개

```bash
git clone https://github.com/tkdgns25300/school_library
cd school_library
git checkout dev
npm install
# .env 복원 (아래 참조)
npm run build       # sanity check (Turbopack)
```

### `.env` 복원

`.env`는 gitignored — repo에 없음. 둘 중 하나로 복원:

- **A. 기존 PC의 `.env` 복사**: 1Password / 패스워드 매니저 / 보안 USB. **이메일·슬랙 등 평문 전송 금지.**
- **B. Supabase Dashboard에서 재생성**: Settings → API에서 키 4개 복사

필수 키 (`.env.example` 참조):
```
NEXT_PUBLIC_SUPABASE_URL=https://lwjzyuxjwdeolmsmmmhi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<service_role JWT>
ADMIN_EMAIL=admin@thehim.school
```

## Supabase MCP 셋업

DB·Storage 직접 조작용. 새 PC마다 1회 셋업 권장.

### 1. PAT 발급
https://supabase.com/dashboard/account/tokens → Generate new token → 이름 `school-library-mcp` → 복사

### 2. MCP 서버 등록 (터미널에서, 채팅창 X)
```bash
claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase@latest --project-ref=lwjzyuxjwdeolmsmmmhi --access-token=YOUR_PAT
```
- `YOUR_PAT`만 본인 PAT로 치환
- `-s user`: 전역(모든 프로젝트). 이 repo에만 쓰려면 `-s project`로 바꾸면 `.mcp.json` 생성됨
- 쓰기 작업이 많으므로 `--read-only` 플래그는 **넣지 않는다**

### 3. Claude Code 재시작 또는 `/mcp` 로 로드
이후 AI가 `mcp__supabase__*` 툴로 직접 DB·Storage 작업 가능 (SQL 실행, 테이블 조회, 타입 생성 등).

## 운영 규칙 (작업하는 AI는 반드시 따른다)

- **Git**: `commit` / `push` / `merge`는 **사용자가 명시적으로 요청할 때만** 수행. 자동 커밋 금지.
- **브랜치**: `main`(배포) / `dev`(작업) 2개만. feature 브랜치 X. 작업은 항상 `dev`에서.
- **소통**: 사용자와는 한국어. 커밋 메시지는 영어, 동사 원형(Add/Fix/Update/Remove)으로 시작.
- **컨벤션**: `CLAUDE.md`의 모든 규칙을 따른다. Clean Code 원칙 엄격히.
- **문서 책임 분리**: CLAUDE=HOW, SPEC=WHAT, SCHEMA=DATA, ROADMAP=TODO, README=INDEX. 중복 금지.
- **Next.js 16 / React 19 주의**: 학습 데이터와 다를 수 있으므로 코드 작성 전 `node_modules/next/dist/docs/` 가이드 확인.

## 도메인 핵심 요약

> 자세한 내용은 SPEC.md / SCHEMA.md.

- **페이지 5개로 고정**: `/`(운영) · `/loans`(대여 현황) · `/students` · `/teachers` · `/books`
- **반(`class_section`)**: `junior 1` / `junior 2` / `senior 1` (1~3학년→junior, 4~6학년→senior)
- **언어**: `ko`(남색) / `en`(초록). `books.level`은 한국어=단계, 영어=레벨 (UI 명칭 분기)
- **표지 이미지**: Supabase Storage `book-covers` 버킷 업로드, public URL을 `books.cover_image_url`에 저장
- **단일 관리자 + 다수 교사**: 1개 계정 공용 로그인, 대여·반납 시 `teachers`에서 담당자 dropdown 선택
- **바코드**: `BK00001`~ (PostgreSQL 시퀀스). 발급 `bwip-js`, 스캔은 키보드 에뮬레이션(`<input>` + `onKeyDown Enter`)
- **정렬 규칙**: SPEC.md '정렬 규칙' 표가 단일 진실 (학생 명단은 학년→반→이름, 운영·대여 현황은 연체 먼저 → 학년 ↑ → ...)
