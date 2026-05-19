import { sortActiveLoansForOperation } from "@/lib/sort/loans";
import { sortStudentsForRoster } from "@/lib/sort/students";
import { createServiceClient } from "@/lib/supabase/service";
import type { ClassSection } from "@/types/domain";

export type Student = {
  id: string;
  name: string;
  grade: number;
  class_section: string;
};

export type ActiveLoan = {
  id: string;
  due_date: string;
  student: { id: string; name: string; grade: number; class_section: string };
  book: { id: string; title: string; author: string | null; language: string };
};

export type OperationData = {
  students: Student[];
  koLoans: ActiveLoan[];
  enLoans: ActiveLoan[];
  totalActive: number;
  overdueCount: number;
};

export async function getOperationData(
  section: ClassSection,
  today: string,
): Promise<OperationData> {
  const supabase = createServiceClient();
  const [studentsRes, loansRes, booksRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, grade, class_section")
      .eq("class_section", section),
    supabase
      .from("loans")
      .select("id, due_date, book_id, student_id")
      .is("returned_at", null),
    supabase.from("books").select("id, title, author, language"),
  ]);

  const students = sortStudentsForRoster(studentsRes.data ?? []);

  const studentMap = new Map((studentsRes.data ?? []).map((s) => [s.id, s]));
  const bookMap = new Map((booksRes.data ?? []).map((b) => [b.id, b]));

  const sectionLoans: ActiveLoan[] = (loansRes.data ?? [])
    .map((l) => {
      const student = studentMap.get(l.student_id);
      const book = bookMap.get(l.book_id);
      if (!student || !book) return null;
      return { id: l.id, due_date: l.due_date, student, book };
    })
    .filter((l): l is ActiveLoan => l !== null);

  const koLoans = sortActiveLoansForOperation(
    sectionLoans.filter((l) => l.book.language === "ko"),
  );
  const enLoans = sortActiveLoansForOperation(
    sectionLoans.filter((l) => l.book.language === "en"),
  );

  const overdueCount = sectionLoans.filter((l) => l.due_date < today).length;

  return {
    students,
    koLoans,
    enLoans,
    totalActive: sectionLoans.length,
    overdueCount,
  };
}
