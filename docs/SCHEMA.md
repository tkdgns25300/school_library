# School Library — 데이터 설계

> DB 스키마·인덱스·RLS·CSV 포맷·SQL 패턴. 비즈니스 동작은 [`SPEC.md`](./SPEC.md).

## 아키텍처 결정

모든 도메인 데이터(교사, 학생, 책, 대여)를 **Supabase PostgreSQL**에 저장. 단일 관리자 환경이라 RLS는 단순(인증된 사용자에게 전체 권한). UI에 노출되지 않는 `created_at`/`updated_at`도 모든 테이블에 두어 운영상 디버깅·복구에 활용.

**DB는 데이터 저장 전용** — DB trigger·custom function·복잡한 default expression을 만들지 않는다. ID 발급·timestamp 갱신·집계 등 모든 비즈니스 로직은 Next.js Server (Server Component / Server Action)에서 처리. PostgreSQL의 내장 기능(`gen_random_uuid()`, sequence의 `nextval()`, CHECK 제약, FK)만 사용.

## 테이블

### 1. `teachers` (교사 명단)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| name | text | NOT NULL, UNIQUE | 교사 이름 |
| class_section | text | NOT NULL, CHECK IN ('junior 1','junior 2','senior 1') | 담당 반 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | Server Action이 UPDATE 시 명시적으로 `now()` 세팅 |

### 2. `students` (학생)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| name | text | NOT NULL | 이름 |
| grade | smallint | NOT NULL, CHECK (1~6) | 학년 |
| class_section | text | NOT NULL, CHECK IN ('junior 1','junior 2','senior 1') | 반 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | Server Action이 UPDATE 시 명시적으로 `now()` 세팅 |

**복합 CHECK**: `(grade BETWEEN 1 AND 3 AND class_section IN ('junior 1','junior 2')) OR (grade BETWEEN 4 AND 6 AND class_section = 'senior 1')` — 학년·반 조합 무결성.

출석번호(`student_number`) 같은 필드는 두지 않음.

### 3. `books` (책)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | text | PK (default 없음) | 바코드 ID (`BK00001`~). Server Action이 발급 |
| title | text | NOT NULL | |
| author | text | | |
| publisher | text | | |
| language | text | NOT NULL, CHECK IN ('ko','en') | 한국어/영어 구분 |
| level | text | | 1~13 (UI에서 한국어 책은 `1단계`, 영어 책은 `Level 1`로 표시). DB는 숫자 문자열 그대로 |
| cover_image_url | text | | 표지 이미지 URL (Storage `book-covers` 버킷의 public URL) |
| registered_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | Server Action이 UPDATE 시 명시적으로 `now()` 세팅 |

라벨 인쇄 여부 추적용 `printed` 컬럼은 두지 않음. 라벨 출력은 책 목록에서 다중 선택해 일회성 PDF 생성.

### 4. `loans` (대여 기록)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| student_id | uuid | NOT NULL, FK → students(id) ON DELETE RESTRICT | |
| book_id | text | NOT NULL, FK → books(id) ON DELETE RESTRICT | 바코드 |
| handled_by_teacher_id | uuid | NOT NULL, FK → teachers(id) ON DELETE RESTRICT | 대여 처리 교사 |
| loaned_at | timestamptz | NOT NULL, DEFAULT now() | |
| due_date | date | NOT NULL | 반납 예정일 |
| returned_at | timestamptz | | NULL이면 대여 중 |
| returned_by_teacher_id | uuid | FK → teachers(id) ON DELETE RESTRICT | 반납 처리 교사 |

`loans`에는 `updated_at` 컬럼이 없다. 상태 전이는 `returned_at`으로 표현.

**UNIQUE(book_id) WHERE returned_at IS NULL** — 한 책의 활성 대여는 1개만.

### 5. 관리자 계정

별도 테이블 없음. Supabase Auth `auth.users`에 단일 계정 (대시보드에서 생성).

## 인덱스

| 테이블 | 인덱스 | 용도 |
|---|---|---|
| books | `(language)` | 책 목록 한/영 탭 |
| loans | `(book_id) WHERE returned_at IS NULL` | 반납 시 활성 대여 매칭 (UNIQUE) |
| loans | `(student_id, returned_at)` | 학생별 현재 대여·이력 |
| loans | `(due_date) WHERE returned_at IS NULL` | 연체 조회 |
| students | `(grade, class_section)` | 학년·반 정렬·필터 |
| teachers | `(class_section)` | 반별 담당 교사 조회 |

## RLS

모든 테이블 RLS 활성화. 정책: `authenticated` 사용자에게 SELECT/INSERT/UPDATE/DELETE 전부 허용(`USING (true) WITH CHECK (true)`), `anon`은 거부. 단일 관리자 운영이라 의도된 단순화.

## 바코드 ID 발급

DB 컬럼 default는 두지 않는다. **Next.js Server Action**이 발급:

```ts
// pseudo-code (실제 구현은 Phase 1 책 페이지)
const { data: { nextval } } = await supabase.rpc('nextval', { sequence: 'book_id_seq' })
// 또는 SQL: SELECT nextval('book_id_seq') AS v
const id = 'BK' + String(nextval).padStart(5, '0')
await supabase.from('books').insert({ id, title, ... })
```

`book_id_seq`는 PostgreSQL 시퀀스(`CREATE SEQUENCE book_id_seq START 1`). 99,999권 초과 시 lpad 자리수 6으로 확장.

## CSV 포맷

UTF-8, header 행 필수.

### 학생 CSV
```csv
name,grade,class_section
홍길동,3,junior 2
김영희,5,senior 1
```
- `class_section`은 `junior 1` / `junior 2` / `senior 1` 정확히 일치
- 학년·반 조합 무결성 검증 (DB CHECK과 동일)

### 교사 CSV
```csv
name,class_section
김교사,junior 1
이교사,senior 1
```

### 책 CSV
```csv
title,author,publisher,language,level,cover_image_url
해리포터와 마법사의 돌,J.K.롤링,문학수첩,ko,4,https://...
The Cat in the Hat,Dr. Seuss,Random House,en,1,https://...
```
- 바코드 ID는 Server Action이 자동 발급(CSV에 없음)
- `language`는 `ko` 또는 `en`
- `cover_image_url`은 비워둘 수 있음

업로드 시 행별 검증, 정상 행만 INSERT, 실패 행은 사유와 함께 리포트.

## 표지 이미지 (Supabase Storage)

책 표지 파일은 **Supabase Storage**에 저장하고, `books.cover_image_url`에는 public URL을 기록한다.

- **버킷**: `book-covers` (public 접근)
- **파일 경로**: `book-covers/{book_id}.{ext}` (예: `book-covers/BK00001.jpg`)
- **업로드 흐름**: 책 등록·수정 시 파일 업로드 → 반환된 public URL을 `cover_image_url`에 저장. 책 삭제 시 Storage 객체도 함께 정리.
- **Storage RLS**:
  - `SELECT`: public (학생도 접근 가능)
  - `INSERT` / `UPDATE` / `DELETE`: `authenticated` (관리자만)

## 정렬 쿼리 패턴

UI 정렬 규칙(전역)을 SQL로 표현하는 표준 패턴:

```sql
-- 학생 명단: 학년 → 반 → 이름
ORDER BY grade ASC,
         CASE class_section
           WHEN 'junior 1' THEN 1
           WHEN 'junior 2' THEN 2
           WHEN 'senior 1' THEN 3
         END,
         name

-- 대여 데스크 — 대여 중 리스트: 연체 먼저 → 학년 ↑ → 이름
ORDER BY (CASE WHEN loans.due_date < CURRENT_DATE
                 AND loans.returned_at IS NULL THEN 0 ELSE 1 END),
         students.grade ASC,
         students.name

-- 대여 현황: 연체 먼저 → 학년 ↑ → 반납 예정일 ↑
ORDER BY (CASE WHEN loans.due_date < CURRENT_DATE
                 AND loans.returned_at IS NULL THEN 0 ELSE 1 END),
         students.grade ASC,
         loans.due_date ASC
```

## 설계 결정

- **`books.id`를 uuid 대신 barcode 텍스트로**: 스캐너 입력값과 PK 직접 일치 → 매핑 불필요, 디버깅 용이.
- **`loans` soft delete X**: 반납은 `returned_at` 채움. 이력 보존.
- **`books.printed` 컬럼 제거**: 라벨 인쇄 여부 추적 가치가 없다고 판단(운영상 일회성 작업). 라벨 PDF는 사용자가 책 목록에서 다중 선택해서 출력.
- **`books.language` + `books.level`**: 한국어/영어 분리 운영의 핵심 키. UI에서 한/영 탭과 단계·레벨 명칭 분기에 사용.
- **`students.student_number` 등 미사용 필드 미도입**: 단순화. 필요해지면 마이그레이션으로 추가.
- **`teachers.class_section` 추가**: 교사 명단에 담당 반을 표시하기 위한 필수 정보.
- **FK ON DELETE RESTRICT**: 학생/책/교사 함부로 삭제해서 대여 이력이 깨지지 않도록 차단.
- **관리자 테이블 없이 `auth.users` 단일 계정**: 단순성 + Supabase Auth 표준 기능 활용.
- **DB trigger / custom function 없음**: timestamp 갱신·ID 발급 같은 로직은 Next.js Server에서. DB는 데이터 저장과 무결성 제약(CHECK·FK·UNIQUE)만 담당.
