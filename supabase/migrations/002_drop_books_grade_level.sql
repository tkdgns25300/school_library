-- Drop unused `grade_level` column from books.
-- 권장 학년 필드를 UI에서 제거하면서 함께 정리. 데이터 비어있어 무손실.
ALTER TABLE books DROP COLUMN grade_level;
