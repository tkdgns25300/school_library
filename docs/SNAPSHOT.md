# Snapshot — 2026-05-15 (저녁)

> 시점 핸드오프. 새 환경에서 재개 시 이 파일부터.
> 영구 사실은 [`../CLAUDE.md`](../CLAUDE.md) · [`SPEC.md`](./SPEC.md) · [`SCHEMA.md`](./SCHEMA.md) · [`ROADMAP.md`](./ROADMAP.md) · [`../README.md`](../README.md).
> Phase 2 시작하거나 정리 끝나면 갱신·삭제.

## 현재 위치 — 🎉 Phase 1 (MVP) 완료

5페이지 모두 운영 가능:

| 라우트 | 기능 |
|---|---|
| `/login` | Supabase Auth |
| `/` | 운영 홈 — 반 카드 3개(실 KPI) → 클릭 시 반별 |
| `/operation/[section]` | 반별 운영 — 한·영 칼럼, lend/return + 가드 + 활성 대여 리스트 |
| `/students` | CRUD + CSV + KO/EN (대여/연체) 실시간 표시 |
| `/teachers` | CRUD + CSV |
| `/books` | CRUD + 표지 Storage + CSV + 라벨 PDF + 상태 토글 |
| `/loans` | 대여 현황 — KPI + 회수 우선순위 표 + 상세 모달 + 반납 처리 |

**최신 커밋**: `526bf73` (Wire book status toggle and active-loan badges)

## 다음 작업 후보 (우선순위 순)

### 정리 (Phase 2 진입 전 권장)
1. CSV Dialog 추상화 — teachers/students/books 3중복 → `src/components/csv-import-dialog.tsx` 공통화
2. Delete Dialog 추상화 — 동일 3중복 → 공통 confirm dialog
3. `book-form-dialog.tsx` 분해 검토 (275줄, 표지 picker·언어 토글 sub) — 선택
4. `URL.createObjectURL` revoke (book-form-dialog) — 미세 메모리

### Phase 2 (운영 편의)
- [ ] 추세 통계 (인기 도서 Top N, 학년별 빈도)
- [ ] 학년 진급 일괄 처리 / 6학년 졸업 처리
- [ ] 책·학생 일괄 작업

### Phase 3 (선택)
- [ ] ISBN API → 책 정보·표지 자동 채우기
- [ ] 일괄 반납 (방학·졸업)
- [ ] CSV 백업·내보내기
- [ ] 연체 알림 (대여 상세 모달의 "알림 보내기")

## 진행 퍼센티지
- **MVP 기준** (Phase 0 + 1): **100%**
- **전체 기준** (Phase 0+1+2+3): **80%**

## 새 PC 재개 절차
[`README.md`](../README.md)의 'Local Setup' / '환경' / 'Supabase MCP' 그대로:
1. `git clone` → `git checkout dev` → `npm install`
2. `.env` 복원 (Supabase Dashboard에서 키 복사)
3. (AI 작업하려면) Supabase MCP 등록 — 새 PAT 발급 후 `claude mcp add ...`
4. `npm run dev` 또는 새 슬라이스 진입

## 박제 정책 (재확인용)
- **DB는 데이터 저장 전용** — trigger·custom function·복잡 default 만들지 않음. 비즈니스 로직은 Server Action / Server Component에서.
- **Server-only data flow** — Supabase는 무조건 Next.js Server를 거침. 브라우저 클라이언트 X.
- **Next.js 16 Proxy** — `src/middleware.ts` X, `src/proxy.ts` 사용. runtime config 설정 금지.
- **MCP는 SQL·마이그레이션·타입 생성용** — 앱 런타임 통로와 별개.

## 알려진 미세 사항 (운영 시작에 영향 X)
- `nextBookId`는 max(id)+1 — 단일 관리자 race 무시
- `cover_image_url`은 Storage path를 가리키며, 책 삭제 시 가능한 확장자 다 시도 (jpg/jpeg/png/webp/gif) — orphan 가능성 미미
- 학생 명단 (대여/연체) 컬럼은 페이지 진입 시 fetch — 진입할 때마다 fresh
