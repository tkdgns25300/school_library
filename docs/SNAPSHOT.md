# Snapshot — 2026-05-14

> 시점 기반 핸드오프 문서. 새 환경에서 작업 재개 시 이 파일부터 본다.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).
> Phase 0 종료되면 갱신 또는 삭제.

## 현재 위치

**Phase 0 마무리** 중. 검증 기준: 로그인 → 빈 운영 페이지(반 카드 3개) 진입까지.

| 슬라이스 | 상태 |
|---|---|
| S0-1 — Supabase server 클라이언트 + DB 타입 | ✅ (커밋 `ec8e561`) |
| **S0-2** — `src/proxy.ts` + `src/app/login/page.tsx` | ⬅️ 다음 |
| S0-3 — 글로벌 레이아웃 + 빈 운영 페이지(반 카드 3개) | ⏳ |

## 이번 세션 결정 (`CLAUDE.md` · `SCHEMA.md` 박제 완료)

1. **Server-only data flow** — Supabase는 무조건 Next.js Server를 거친다. 브라우저 client(`createBrowserClient`) 만들지 않는다. 단일 데이터 통로: `src/lib/supabase/server.ts`.
2. **DB는 데이터 저장 전용** — DB trigger·custom function·복잡 default expression 만들지 않는다. PostgreSQL 내장(`gen_random_uuid()`, sequence `nextval()`, CHECK, FK)만 사용. ID 발급·timestamp 갱신·집계 등 비즈니스 로직은 Server Action / Server Component에서.

위 결정에 따른 DB 정리(이미 적용됨):
- `set_updated_at()`·`generate_book_id()` 함수 + 3개 BEFORE UPDATE 트리거 제거
- `books.id` default 제거 (Server Action이 `nextval('book_id_seq')` 후 `'BK' + lpad(...)` 조립해 INSERT)
- `supabase/migrations/001_init.sql` · `src/types/database.ts` 모두 동기화

## S0-2 작업 가이드

1. **`src/proxy.ts`** — Next.js 16 Proxy (`middleware.ts`의 새 이름; 자세한 룰은 별도 메모 `nextjs_16_proxy`).
   - 매 요청마다 `session.ts`의 `updateSession(request)` 호출 → `{ supabaseResponse, user }` 반환
   - `!user`이고 경로가 `/login`이 아니면 `/login`으로 redirect
   - **`runtime` config 사용 금지** (에러). 기본 Node.js runtime 그대로 둠.
   - `matcher`로 `_next/static`·`_next/image`·`*.png` 등 정적 자원 제외
2. **`src/app/login/page.tsx`** — 이메일/비밀번호 폼.
   - shadcn `field` + `input` + `button`
   - Server Action에서 `supabase.auth.signInWithPassword({ email, password })`
   - 성공 시 `/`로 redirect, 실패 시 폼에 에러 표시
3. `npm run build` 통과 + 브라우저에서 로그인 흐름 직접 확인

## 새 PC에서 재개 절차

`README.md`의 'Local Setup' / '환경' / 'Supabase MCP' 절차 그대로:

1. `git clone https://github.com/tkdgns25300/school_library` → `cd school_library` → `git checkout dev` → `npm install`
2. `.env` 복원 — Supabase Dashboard → Settings → API에서 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_EMAIL` 채우기
3. (AI 작업 시) Supabase MCP 등록 — Supabase Dashboard에서 **새 토큰 발급** 후 README의 `claude mcp add supabase ...` 한 줄 실행. **이전 토큰은 보안상 폐기**.
4. `npm run dev` → 현재 단계는 빈 placeholder 페이지만 보임 (S0-3까지 끝나야 운영 페이지 등장)

## 참고: 현재 코드에서 사용하는 환경 변수

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`SUPABASE_SERVICE_ROLE_KEY`는 `.env`에 있지만 **현재 코드 어디에서도 import하지 않음** — RLS + ANON_KEY + 쿠키 기반 인증 패턴(@supabase/ssr 표준)이라 service_role이 불필요. 향후에도 시스템 배치 작업 같은 게 생기지 않는 한 사용 안 함.
