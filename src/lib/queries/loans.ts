import { sortLoansForRecall } from "@/lib/sort/loans";
import { createServiceClient } from "@/lib/supabase/service";

export type LoanRow = {
  id: string;
  loaned_at: string;
  due_date: string;
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

export type LoansMonitoringData = {
  loans: LoanRow[];
  teachers: { id: string; name: string }[];
  totalActive: number;
  overdueCount: number;
  maxOverdueDays: number;
  dueTodayCount: number;
};

export async function getLoansForMonitoring(
  today: string,
): Promise<LoansMonitoringData> {
  const supabase = createServiceClient();
  const [loansRes, studentsRes, booksRes, teachersRes] = await Promise.all([
    supabase
      .from("loans")
      .select("id, loaned_at, due_date, book_id, student_id")
      .is("returned_at", null),
    supabase.from("students").select("id, name, grade, class_section"),
    supabase
      .from("books")
      .select("id, title, author, language, cover_image_url"),
    supabase.from("teachers").select("id, name").order("name"),
  ]);

  const studentMap = new Map(
    (studentsRes.data ?? []).map((s) => [s.id, s]),
  );
  const bookMap = new Map((booksRes.data ?? []).map((b) => [b.id, b]));

  const allLoans: LoanRow[] = (loansRes.data ?? [])
    .map((l) => {
      const student = studentMap.get(l.student_id);
      const book = bookMap.get(l.book_id);
      if (!student || !book) return null;
      return {
        id: l.id,
        loaned_at: l.loaned_at,
        due_date: l.due_date,
        student,
        book,
      };
    })
    .filter((l): l is LoanRow => l !== null);

  const sorted = sortLoansForRecall(allLoans);
  const overdue = sorted.filter((l) => l.due_date < today);
  const dueToday = sorted.filter((l) => l.due_date === today);

  let maxOverdueDays = 0;
  for (const l of overdue) {
    const days = Math.floor(
      (Date.parse(today) - Date.parse(l.due_date)) / 86_400_000,
    );
    if (days > maxOverdueDays) maxOverdueDays = days;
  }

  return {
    loans: sorted,
    teachers: teachersRes.data ?? [],
    totalActive: sorted.length,
    overdueCount: overdue.length,
    maxOverdueDays,
    dueTodayCount: dueToday.length,
  };
}
