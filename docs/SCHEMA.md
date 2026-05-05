# School Library — 데이터 설계

## 아키텍처 결정

모든 도메인 데이터(교사, 학생, 책, 대여)를 **Supabase PostgreSQL**에 저장. 단일 관리자 환경이라 RLS는 단순 (인증된 사용자에게 전체 권한).

## 테이블

### 1. `teachers` (교사 명단)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| name | text | NOT NULL, UNIQUE | 교사 이름 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

### 2. `students` (학생)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| name | text | NOT NULL | 이름 |
| grade | smallint | NOT NULL, CHECK (1~6) | 학년 |
| class_section | text | NOT NULL, CHECK IN ('junior 1','junior 2','senior 1') | 반 |
| student_number | text | | 출석번호 |
| created_at | timestamptz | DEFAULT now() | |
| updated_at | timestamptz | DEFAULT now() | |

**복합 CHECK**: `(grade BETWEEN 1 AND 3 AND class_section IN ('junior 1','junior 2')) OR (grade BETWEEN 4 AND 6 AND class_section = 'senior 1')` — 학년·반 조합 무결성.

### 3. `books` (책)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | text | PK | 바코드 ID (`BK00001`~) |
| title | text | NOT NULL | |
| author | text | | |
| publisher | text | | |
| grade_level | smallint | CHECK (1~6) | 대상 학년 |
| registered_at | timestamptz | DEFAULT now() | |
| printed | boolean | NOT NULL, DEFAULT false | 라벨 인쇄 여부 |
| updated_at | timestamptz | DEFAULT now() | |

### 4. `loans` (대여 기록)

| 컬럼 | 타입 | 제약 | 설명 |
|---|---|---|---|
| id | uuid | PK, default `gen_random_uuid()` | |
| student_id | uuid | NOT NULL, FK → students(id) ON DELETE RESTRICT | |
| book_id | text | NOT NULL, FK → books(id) ON DELETE RESTRICT | 바코드 |
| handled_by_teacher_id | uuid | NOT NULL, FK → teachers(id) ON DELETE RESTRICT | 담당 교사 |
| loaned_at | timestamptz | NOT NULL, DEFAULT now() | |
| due_date | date | NOT NULL | 반납 예정일 |
| returned_at | timestamptz | | NULL이면 대여 중 |
| returned_by_teacher_id | uuid | FK → teachers(id) ON DELETE RESTRICT | 반납 처리한 교사 |

**UNIQUE(book_id) WHERE returned_at IS NULL** — 한 책의 활성 대여는 1개만.

### 5. 관리자 계정

별도 테이블 없음. Supabase Auth `auth.users`에 단일 계정 (대시보드에서 생성).

## 인덱스

| 테이블 | 인덱스 | 용도 |
|---|---|---|
| books | `(printed) WHERE printed = false` | 미인쇄 책 조회 |
| loans | `(book_id) WHERE returned_at IS NULL` | 반납 시 활성 대여 매칭 |
| loans | `(student_id, returned_at)` | 학생별 현재 대여·이력 |
| loans | `(due_date) WHERE returned_at IS NULL` | 연체 조회 |
| students | `(grade, class_section)` | 반/학년 필터 |

## RLS

모든 테이블 RLS 활성화. 정책: `auth.role() = 'authenticated'`인 사용자에게 SELECT/INSERT/UPDATE/DELETE 전부 허용. anon 거부. 단일 관리자 환경이라 단순.

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
name,grade,class_section,student_number
홍길동,3,junior 2,15
김영희,5,senior 1,7
```
- `class_section`은 `junior 1` / `junior 2` / `senior 1` 정확히 일치.
- `grade`와 `class_section` 조합 무결성 검증 (DB CHECK과 동일 규칙).

### 책 CSV
```csv
title,author,publisher,grade_level
해리포터와 마법사의 돌,J.K.롤링,문학수첩,4
어린왕자,생텍쥐페리,문학동네,
```
- 바코드 ID는 시스템이 자동 발급(CSV에 없음).

### 교사 CSV
```csv
name
김교사
이교사
```

업로드 시 행별 검증, 정상 행만 INSERT, 실패 행은 사유와 함께 리포트.

## 설계 결정

- **`books.id`를 uuid 대신 barcode 텍스트로**: 스캐너 입력값과 PK가 직접 일치 → 매핑 불필요, 디버깅 용이.
- **`loans` soft delete X**: 반납은 `returned_at` 채움. 이력 보존.
- **`books.printed` 별도 컬럼**: "라벨 안 붙인 책" 조회가 잦고 부분 인덱스로 효율 ↑.
- **`teachers` 테이블 분리**: 다수 교사가 단일 관리자 계정으로 로그인 → 행위 주체를 구분하려면 별도 엔터티 필요.
- **`returned_by_teacher_id` 추가**: 대여 담당과 반납 담당이 다를 수 있음. 양쪽 기록.
- **관리자 테이블 없이 `auth.users` 단일 계정**: 단순성 + Supabase Auth 표준 기능 활용.
- **FK ON DELETE RESTRICT**: 학생/책/교사를 함부로 삭제해서 대여 이력이 깨지지 않도록 차단.
