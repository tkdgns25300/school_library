# School Library

더힘스쿨 수지점(기독교 대안학교, 1~6학년)의 도서 대여 관리 웹앱. 교사가 USB 바코드 스캐너로 대여·반납을 처리하고, 반별로 대여·연체를 모니터링한다.

## Stack

Next.js 14+ (App Router) · TypeScript · Tailwind + shadcn/ui · Supabase · Vercel

## Local Setup

```bash
npm install
cp .env.example .env.local   # Supabase 키 입력
npm run dev
```

관리자 계정은 Supabase 대시보드에서 직접 생성 (회원가입 UI 없음).

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — 컨벤션 · 아키텍처 · 클린 코드 원칙
- [`docs/SPEC.md`](./docs/SPEC.md) — 기획서 (학교 구조, 핵심 기능, 우선순위)
- [`docs/SCHEMA.md`](./docs/SCHEMA.md) — DB 스키마 · RLS · CSV 포맷
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — Phase별 작업 체크리스트
