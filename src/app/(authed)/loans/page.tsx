import { PageHeader } from "@/components/layout/page-header";
import { sortLoansForRecall } from "@/lib/sort/loans";
import { createClient } from "@/lib/supabase/server";

import { LoansView, type LoanRow } from "./loans-view";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function LoansPage() {
  const supabase = await createClient();

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

  const today = todayIso();
  const overdue = sorted.filter((l) => l.due_date < today);
  const dueToday = sorted.filter((l) => l.due_date === today);

  let maxOverdueDays = 0;
  for (const l of overdue) {
    const days = Math.floor(
      (Date.parse(today) - Date.parse(l.due_date)) / 86_400_000,
    );
    if (days > maxOverdueDays) maxOverdueDays = days;
  }

  return (
    <>
      <PageHeader title="대여 현황" subtitle="빌려간 책 · 연체 한눈에" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <LoansView
            loans={sorted}
            teachers={teachersRes.data ?? []}
            totalActive={sorted.length}
            overdueCount={overdue.length}
            maxOverdueDays={maxOverdueDays}
            dueTodayCount={dueToday.length}
          />
        </div>
      </main>
    </>
  );
}
