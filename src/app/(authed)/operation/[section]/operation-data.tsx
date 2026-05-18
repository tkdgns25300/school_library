import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { todayIso } from "@/lib/date";
import { sortActiveLoansForOperation } from "@/lib/sort/loans";
import { sortStudentsForRoster } from "@/lib/sort/students";
import { createClient } from "@/lib/supabase/server";
import type { ClassSection } from "@/types/domain";

import { OperationView, type ActiveLoan } from "./operation-view";

export async function OperationData({
  section,
  sectionId,
}: {
  section: ClassSection;
  sectionId: string;
}) {
  const supabase = await createClient();
  const [studentsRes, teachersRes, loansRes, booksRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, grade, class_section")
      .eq("class_section", section),
    supabase
      .from("teachers")
      .select("id, name, class_section")
      .order("name"),
    supabase
      .from("loans")
      .select("id, due_date, book_id, student_id")
      .is("returned_at", null),
    supabase.from("books").select("id, title, author, language"),
  ]);

  const students = sortStudentsForRoster(studentsRes.data ?? []);
  const teachers = teachersRes.data ?? [];

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

  const today = todayIso();
  const overdueCount = sectionLoans.filter((l) => l.due_date < today).length;

  return (
    <>
      <SectionSummary
        sectionId={sectionId}
        studentCount={students.length}
        activeCount={sectionLoans.length}
        overdueCount={overdueCount}
      />
      <OperationView
        section={section}
        students={students}
        teachers={teachers}
        koLoans={koLoans}
        enLoans={enLoans}
      />
    </>
  );
}

export function OperationSkeleton({ sectionId }: { sectionId: string }) {
  return (
    <SectionSummary
      sectionId={sectionId}
      studentCount={null}
      activeCount={null}
      overdueCount={0}
    />
  );
}

function SectionSummary({
  sectionId,
  studentCount,
  activeCount,
  overdueCount,
}: {
  sectionId: string;
  studentCount: number | null;
  activeCount: number | null;
  overdueCount: number;
}) {
  const loading = studentCount === null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        반 선택
      </Link>
      <span className="text-muted-foreground">·</span>
      <Badge variant="secondary">{sectionId}</Badge>
      <span className="text-sm text-muted-foreground">
        {loading ? (
          "불러오는 중…"
        ) : (
          <>
            학생 {studentCount}명 · 대여 중 {activeCount}권
            {overdueCount > 0 ? (
              <>
                {" · "}
                <span className="font-semibold text-destructive">
                  연체 {overdueCount}권
                </span>
              </>
            ) : null}
          </>
        )}
      </span>
    </div>
  );
}
