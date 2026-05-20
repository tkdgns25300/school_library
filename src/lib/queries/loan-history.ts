import { createServiceClient } from "@/lib/supabase/service";

export type HistoryRow = {
  id: string;
  loaned_at: string;
  due_date: string;
  returned_at: string;
  student: {
    id: string;
    name: string;
    grade: number;
    class_section: string;
  };
  book: {
    id: string;
    title: string;
    author: string | null;
    language: string;
    cover_image_url: string | null;
  };
};

export async function getLoanHistory(): Promise<HistoryRow[]> {
  const supabase = createServiceClient();
  const [loansRes, studentsRes, booksRes] = await Promise.all([
    supabase
      .from("loans")
      .select("id, loaned_at, due_date, returned_at, book_id, student_id")
      .not("returned_at", "is", null)
      .order("returned_at", { ascending: false }),
    supabase.from("students").select("id, name, grade, class_section"),
    supabase
      .from("books")
      .select("id, title, author, language, cover_image_url"),
  ]);

  const studentMap = new Map(
    (studentsRes.data ?? []).map((s) => [s.id, s]),
  );
  const bookMap = new Map((booksRes.data ?? []).map((b) => [b.id, b]));

  return (loansRes.data ?? [])
    .map((l) => {
      const student = studentMap.get(l.student_id);
      const book = bookMap.get(l.book_id);
      if (!student || !book || !l.returned_at) return null;
      return {
        id: l.id,
        loaned_at: l.loaned_at,
        due_date: l.due_date,
        returned_at: l.returned_at,
        student,
        book,
      };
    })
    .filter((l): l is HistoryRow => l !== null);
}
