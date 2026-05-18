import { sortStudentsForRoster } from "@/lib/sort/students";
import { createServiceClient } from "@/lib/supabase/service";

export type StudentWithStats = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
  koActive: number;
  koOverdue: number;
  enActive: number;
  enOverdue: number;
};

type Stats = {
  koActive: number;
  koOverdue: number;
  enActive: number;
  enOverdue: number;
};

export async function getStudentsWithStats(
  today: string,
): Promise<StudentWithStats[]> {
  const supabase = createServiceClient();
  const [studentsRes, loansRes, booksRes] = await Promise.all([
    supabase.from("students").select("id, name, grade, class_section"),
    supabase
      .from("loans")
      .select("id, due_date, book_id, student_id")
      .is("returned_at", null),
    supabase.from("books").select("id, language"),
  ]);

  const bookLangMap = new Map(
    (booksRes.data ?? []).map((b) => [b.id, b.language]),
  );

  const statsByStudent = new Map<string, Stats>();
  for (const loan of loansRes.data ?? []) {
    const language = bookLangMap.get(loan.book_id);
    if (!language) continue;
    const isOverdue = loan.due_date < today;
    const stats = statsByStudent.get(loan.student_id) ?? {
      koActive: 0,
      koOverdue: 0,
      enActive: 0,
      enOverdue: 0,
    };
    if (language === "ko") {
      stats.koActive++;
      if (isOverdue) stats.koOverdue++;
    } else if (language === "en") {
      stats.enActive++;
      if (isOverdue) stats.enOverdue++;
    }
    statsByStudent.set(loan.student_id, stats);
  }

  return sortStudentsForRoster(studentsRes.data ?? []).map((s) => ({
    ...s,
    koActive: statsByStudent.get(s.id)?.koActive ?? 0,
    koOverdue: statsByStudent.get(s.id)?.koOverdue ?? 0,
    enActive: statsByStudent.get(s.id)?.enActive ?? 0,
    enOverdue: statsByStudent.get(s.id)?.enOverdue ?? 0,
  }));
}
