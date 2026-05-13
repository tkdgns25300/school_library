# School Library

더힘스쿨 수지점(기독교 대안학교, 1~6학년)의 도서 대여 관리 웹앱. 교사가 USB 바코드 스캐너로 반별·언어별(한국어/영어) 대여·반납을 처리한다.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 + shadcn/ui (Base UI) · Supabase · Vercel

## Pages (5)

- `/` 운영 (반 선택 → 한·영 1:1 칼럼, 대여·반납·연속 스캔)
- `/loans` 대여 현황 (회수 우선순위 액션 목록, 한·영 구분)
- `/students` 학생 명단
- `/teachers` 교사 명단
- `/books` 책 목록 (한·영 탭, 표지, 단계/레벨)

## Local Setup

```bash
npm install
cp .env.example .env.local   # Supabase 키 입력
npm run dev
```

관리자 계정은 Supabase 대시보드에서 직접 생성 (회원가입 UI 없음).

## Documentation

- [`CLAUDE.md`](./CLAUDE.md) — 컨벤션 · 아키텍처 · 클린 코드 원칙
- [`docs/SPEC.md`](./docs/SPEC.md) — 기획서 (학교 구조, 5페이지, 도메인)
- [`docs/SCHEMA.md`](./docs/SCHEMA.md) — DB 스키마 · RLS · CSV 포맷 · 정렬 쿼리 패턴
- [`docs/ROADMAP.md`](./docs/ROADMAP.md) — Phase별 작업 체크리스트
