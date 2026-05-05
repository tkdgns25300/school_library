# School Library — 데이터 설계

> DB 스키마·인덱스·RLS·CSV 포맷·SQL 패턴. 비즈니스 동작은 [`SPEC.md`](./SPEC.md).

## 아키텍처 결정

모든 도메인 데이터(교사, 학생, 책, 대여)를 **Supabase PostgreSQL**에 저장. 단일 관리자 환경이라 RLS는 단순(인증된 사용자에게 전체 권한). UI에 노출되지 않는 `created_at`/`updated_at`도 모든 테이블에 두어 운영상 디버깅·복구에 활용.

## 테이블

### 1. `teachers` (교사 명단)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| name | text | NOT NULL, UNIQUE | 교사 이름 |
| class_section | text | NOT NULL, CHECK IN ('junior 1','junior 2','senior 1') | 담당 반 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 2. `students` (학생)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| name | text | NOT NULL | 이름 |
| grade | smallint | NOT NULL, CHECK (1~6) | 학년 |
| class_section | text | NOT NULL, CHECK IN ('junior 1','junior 2','senior 1') | 반 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**복합 CHECK**: `(grade BETWEEN 1 AND 3 AND class_section IN ('junior 1','junior 2')) OR (grade BETWEEN 4 AND 6 AND class_section = 'senior 1')` — 학년·반 조합 무결성.

출석번호(`student_number`) 같은 필드는 두지 않음.

### 3. `books` (책)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | text | PK | 바코드 ID (`BK00001`~) |
| title | text | NOT NULL | |
| author | text | | |
| publisher | text | | |
| grade_level | smallint | CHECK (1~6) | 권장 학년 |
| language | text | NOT NULL, CHECK IN ('ko','en') | 한국어/영어 구분 |
| level | text | | 한국어=단계, 영어=레벨 (예: `1`, `2단계`, `Level 3`, `AR 2.5`) |
| cover_image_url | text | | 표지 이미지 URL |
| registered_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

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

**UNIQUE(book_id) WHERE returned_at IS NULL** — 한 책의 활성 대여는 1개만.

### 5. 관리자 계정

별도 테이블 없음. Supabase Auth `auth.users`에 단일 계정 (대시보드에서 생성).

## 인덱스

| 테이블 | 인덱스 | 용도 |
|---|---|---|
| books | `(language)` | 책 목록 한/영 탭 |
| books | `(grade_level)` | 학년 필터 |
| loans | `(book_id) WHERE returned_at IS NULL` | 반납 시 활성 대여 매칭 |
| loans | `(student_id, returned_at)` | 학생별 현재 대여·이력 |
| loans | `(due_date) WHERE returned_at IS NULL` | 연체 조회 |
| students | `(grade, class_section)` | 학년·반 정렬·필터 |
| teachers | `(class_section)` | 반별 담당 교사 조회 |

## RLS

모든 테이블 RLS 활성화. 정책: `auth.role() = 'authenticated'` 사용자에게 SELECT/INSERT/UPDATE/DELETE 전부 허용. anon 거부. 단일 관리자라 단순.

## 바코드 ID 발급

```sql
CREATE SEQUENCE book_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_book_id()
RETURNS text LANGUAGE sql AS $$
  SELECT 'BK' || lpad(nextval('book_id_seq')::text, 5, '0');
$$;
```

`books.id` default를 `generate_book_id()`로 지정. 99,999권 초과 시 6자리로 확장.

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
title,author,publisher,grade_level,language,level,cover_image_url
해리포터와 마법사의 돌,J.K.롤링,문학수첩,4,ko,4단계,https://...
The Cat in the Hat,Dr. Seuss,Random House,2,en,Level 1,https://...
```
- 바코드 ID는 시스템이 자동 발급(CSV에 없음)
- `language`는 `ko` 또는 `en`
- `cover_image_url`은 비워둘 수 있음

업로드 시 행별 검증, 정상 행만 INSERT, 실패 행은 사유와 함께 리포트.

## 표지 이미지 (cover_image_url)

- 1차: **외부 URL** (네이버 책 등에서 제공하는 이미지 주소). 가장 단순.
- 추후(Phase 2~3): Supabase Storage로 마이그레이션 검토. 외부 링크 만료 위험 대응.

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

-- 운영/통계의 대여 중 학생: 연체 먼저 → 학년 오름차순 → 이름
ORDER BY (CASE WHEN loans.due_date < CURRENT_DATE
                 AND loans.returned_at IS NULL THEN 0 ELSE 1 END),
         students.grade ASC,
         students.name
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
