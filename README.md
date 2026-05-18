# School Library

더힘스쿨 수지점(기독교 대안학교, 1~6학년)의 도서 대여 관리 웹앱. 교사가 USB 바코드 스캐너로 반별·언어별(한국어/영어) 대여·반납을 처리한다.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 + shadcn/ui (Base UI) · Supabase · Vercel

## Pages

- `/` 대여 데스크 (반 카드 → 반별 운영 화면 진입)
- `/operation/[section]` 반별 대여 데스크 (한·영 1:1 칼럼, 대여·반납·연속 스캔)
- `/loans` 대여 현황 (회수 우선순위 액션 목록, 한·영 구분)
- `/students` 학생 명단
- `/teachers` 교사 명단
- `/books` 책 목록 (한·영 탭, 표지, 단계/레벨, 라벨 PDF)

## Documentation

읽는 순서:

1. [`CLAUDE.md`](./CLAUDE.md) — **HOW**. 아키텍처·캐싱 전략·코딩 컨벤션·도메인 룰
2. [`docs/SPEC.md`](./docs/SPEC.md) — **WHAT**. 페이지·기능 명세
3. [`docs/SCHEMA.md`](./docs/SCHEMA.md) — **DATA**. DB 스키마·Storage·CSV·SQL 패턴
4. [`docs/ROADMAP.md`](./docs/ROADMAP.md) — **TODO**. Phase별 체크리스트와 진행 상황
5. [`docs/SNAPSHOT.md`](./docs/SNAPSHOT.md) — **현재 상태**. 시점 핸드오프 (재개 시 첫 참조)

## Local Setup

```bash
git clone https://github.com/tkdgns25300/school_library
cd school_library
git checkout dev
npm install
cp .env.example .env       # 키 채우기 (아래 '환경 변수' 참조)
npm run build              # sanity check (Turbopack)
npm run dev
```

관리자 계정은 Supabase 대시보드에서 직접 생성 (회원가입 UI 없음).

## 환경

| 항목 | 값 |
|---|---|
| Supabase project ref | `sxlxetjqhaszbzvxfcwu` (region `ap-northeast-2` Seoul) |
| Supabase URL | `https://sxlxetjqhaszbzvxfcwu.supabase.co` |
| GitHub repo | `https://github.com/tkdgns25300/school_library` |
| Vercel project | `school_library` (production = `main`, function region `icn1`) |
| Admin 계정 | `admin@thehim.school` (비번은 별도 보관) |
| Storage 버킷 | `book-covers` (public read, authenticated write) |
| Vercel Cron | `/api/cron/midnight` 매일 KST 00:00 (UTC 15:00) — `CRON_SECRET` 필수 |

### 환경 변수

`.env`는 gitignored — repo에 없다. 둘 중 하나로 복원:

- **A. 기존 PC의 `.env` 복사**: 1Password / 패스워드 매니저 / 보안 USB. 이메일·메신저 평문 전송 금지.
- **B. Supabase Dashboard에서 재생성**: Settings → API에서 키 복사.

필수 키 (`.env.example` 참조):

```env
NEXT_PUBLIC_SUPABASE_URL=https://sxlxetjqhaszbzvxfcwu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon JWT>
SUPABASE_SERVICE_ROLE_KEY=<service_role JWT>
ADMIN_EMAIL=admin@thehim.school
CRON_SECRET=<랜덤 시크릿 — Vercel Dashboard에도 동일 값 설정>
```

**`CRON_SECRET` 발급**: `openssl rand -base64 32` 또는 임의 긴 문자열. Vercel Cron이 `/api/cron/midnight` 호출 시 `Authorization: Bearer <secret>`로 검증한다. **반드시 Vercel Dashboard → Project Settings → Environment Variables 에 동일 값 설정**.

## Supabase MCP (선택)

AI가 DB·Storage를 직접 조작할 수 있게 하는 MCP 서버. 새 PC마다 1회 셋업 권장.

1. **PAT 발급**: https://supabase.com/dashboard/account/tokens → Generate new token → 이름 `school-library-mcp` → 복사
2. **MCP 서버 등록** (터미널에서):
   ```bash
   claude mcp add supabase -s user -- npx -y @supabase/mcp-server-supabase@latest \
     --project-ref=sxlxetjqhaszbzvxfcwu \
     --access-token=YOUR_PAT
   ```
   - `YOUR_PAT`만 본인 PAT로 치환
   - `-s user`: 전역(모든 프로젝트). 이 repo에만 적용하려면 `-s project` → `.mcp.json` 생성
   - 쓰기 작업이 많으므로 `--read-only`는 **넣지 않는다**
3. **Claude Code 재시작** 또는 `/mcp`로 로드 → 이후 `mcp__supabase__*` 툴로 SQL·Storage 직접 작업 가능
