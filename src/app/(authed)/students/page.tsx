import { PageHeader } from "@/components/layout/page-header";
import { sortStudentsForRoster } from "@/lib/sort/students";
import { createClient } from "@/lib/supabase/server";

import { StudentsView, type StudentWithStats } from "./students-view";

export const revalidate = 1800;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function StudentsPage() {
  const supabase = await createClient();

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
  const today = todayIso();

  const statsByStudent = new Map<
    string,
    { koActive: number; koOverdue: number; enActive: number; enOverdue: number }
  >();
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

  const sortedStudents = sortStudentsForRoster(studentsRes.data ?? []);
  const studentsWithStats: StudentWithStats[] = sortedStudents.map((s) => ({
    ...s,
    koActive: statsByStudent.get(s.id)?.koActive ?? 0,
    koOverdue: statsByStudent.get(s.id)?.koOverdue ?? 0,
    enActive: statsByStudent.get(s.id)?.enActive ?? 0,
    enOverdue: statsByStudent.get(s.id)?.enOverdue ?? 0,
  }));

  return (
    <>
      <PageHeader title="학생" subtitle="전체 명단 · 반별 조회" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <StudentsView students={studentsWithStats} />
        </div>
      </main>
    </>
  );
}
