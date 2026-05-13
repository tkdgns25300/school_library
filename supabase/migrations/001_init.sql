-- ============================================================
-- School Library — Initial Schema
-- 4 tables + sequence + book_id generator + indexes + RLS + Storage
-- ============================================================

-- ============================
-- 1. Tables
-- ============================

-- Teachers
CREATE TABLE teachers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  class_section text NOT NULL CHECK (class_section IN ('junior 1', 'junior 2', 'senior 1')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Students
CREATE TABLE students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  grade smallint NOT NULL CHECK (grade BETWEEN 1 AND 6),
  class_section text NOT NULL CHECK (class_section IN ('junior 1', 'junior 2', 'senior 1')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT students_grade_class_combo CHECK (
    (grade BETWEEN 1 AND 3 AND class_section IN ('junior 1', 'junior 2'))
    OR (grade BETWEEN 4 AND 6 AND class_section = 'senior 1')
  )
);

-- Book ID sequence + generator
CREATE SEQUENCE book_id_seq START 1;

CREATE OR REPLACE FUNCTION generate_book_id()
RETURNS text LANGUAGE sql AS $$
  SELECT 'BK' || lpad(nextval('book_id_seq')::text, 5, '0');
$$;

-- Books
CREATE TABLE books (
  id text PRIMARY KEY DEFAULT generate_book_id(),
  title text NOT NULL,
  author text,
  publisher text,
  grade_level smallint CHECK (grade_level BETWEEN 1 AND 6),
  language text NOT NULL CHECK (language IN ('ko', 'en')),
  level text,
  cover_image_url text,
  registered_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Loans
CREATE TABLE loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
  book_id text NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  handled_by_teacher_id uuid NOT NULL REFERENCES teachers(id) ON DELETE RESTRICT,
  loaned_at timestamptz NOT NULL DEFAULT now(),
  due_date date NOT NULL,
  returned_at timestamptz,
  returned_by_teacher_id uuid REFERENCES teachers(id) ON DELETE RESTRICT
);

-- One active loan per book (enforced at DB level)
CREATE UNIQUE INDEX loans_active_book_unique
  ON loans(book_id)
  WHERE returned_at IS NULL;

-- ============================
-- 2. Indexes
-- ============================

CREATE INDEX idx_books_language ON books(language);
CREATE INDEX idx_books_grade_level ON books(grade_level);
CREATE INDEX idx_loans_student ON loans(student_id, returned_at);
CREATE INDEX idx_loans_overdue ON loans(due_date) WHERE returned_at IS NULL;
CREATE INDEX idx_students_grade_class ON students(grade, class_section);
CREATE INDEX idx_teachers_class ON teachers(class_section);

-- ============================
-- 3. updated_at triggers
-- ============================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER teachers_set_updated_at BEFORE UPDATE ON teachers
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER students_set_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER books_set_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================
-- 4. RLS (single-admin: authenticated full access, anon denied)
-- ============================

ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE books    ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans    ENABLE ROW LEVEL SECURITY;

CREATE POLICY teachers_authenticated_all ON teachers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY students_authenticated_all ON students
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY books_authenticated_all ON books
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY loans_authenticated_all ON loans
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================
-- 5. Storage bucket: book-covers (public)
-- ============================

INSERT INTO storage.buckets (id, name, public)
VALUES ('book-covers', 'book-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can read covers (public bucket)
CREATE POLICY "book_covers_public_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'book-covers');

-- Only authenticated (admin) can upload/modify/delete covers
CREATE POLICY "book_covers_authenticated_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "book_covers_authenticated_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'book-covers')
  WITH CHECK (bucket_id = 'book-covers');

CREATE POLICY "book_covers_authenticated_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'book-covers');
