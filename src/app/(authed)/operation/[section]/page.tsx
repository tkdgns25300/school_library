import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { sortActiveLoansForOperation } from "@/lib/sort/loans";
import { sortStudentsForRoster } from "@/lib/sort/students";
import { createClient } from "@/lib/supabase/server";
import type { ClassSection } from "@/types/domain";

import { OperationView, type ActiveLoan } from "./operation-view";

export function generateStaticParams() {
  return CLASS_SECTIONS.map((s) => ({ section: s.id }));
}

export default async function OperationSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: rawSection } = await params;
  const section = decodeURIComponent(rawSection);

  const sectionMeta = CLASS_SECTIONS.find((s) => s.id === section);
  if (!sectionMeta) notFound();

  return (
    <>
      <PageHeader
        title="대여 데스크"
        subtitle={`${sectionMeta.label} · ${sectionMeta.description}`}
      />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <Suspense fallback={<OperationSkeleton sectionId={sectionMeta.id} />}>
            <OperationData section={section as ClassSection} />
          </Suspense>
        </div>
      </main>
    </>
  );
}

function OperationSkeleton({ sectionId }: { sectionId: string }) {
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
      <span className="text-sm text-muted-foreground">불러오는 중…</span>
    </div>
  );
}

async function OperationData({ section }: { section: ClassSection }) {
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

  const sectionMeta = CLASS_SECTIONS.find((s) => s.id === section);
  if (!sectionMeta) notFound();

  const students = sortStudentsForRoster(studentsRes.data ?? []);
  const teachers = teachersRes.data ?? [];

  const studentMap = new Map((studentsRes.data ?? []).map((s) => [s.id, s]));
  const bookMap = new Map((booksRes.data ?? []).map((b) => [b.id, b]));

  const sectionLoans: ActiveLoan[] = (loansRes.data ?? [])
    .map((l) => {
      const student = studentMap.get(l.student_id);
      const book = bookMap.get(l.book_id);
      if (!student || !book) return null;
      return {
        id: l.id,
        due_date: l.due_date,
        student,
        book,
      };
    })
    .filter((l): l is ActiveLoan => l !== null);

  const koLoans = sortActiveLoansForOperation(
    sectionLoans.filter((l) => l.book.language === "ko"),
  );
  const enLoans = sortActiveLoansForOperation(
    sectionLoans.filter((l) => l.book.language === "en"),
  );

  const overdueCount = sectionLoans.filter(
    (l) => l.due_date < new Date().toISOString().slice(0, 10),
  ).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          반 선택
        </Link>
        <span className="text-muted-foreground">·</span>
        <Badge variant="secondary">{sectionMeta.id}</Badge>
        <span className="text-sm text-muted-foreground">
          학생 {students.length}명 · 대여 중 {sectionLoans.length}권
          {overdueCount > 0 ? (
            <>
              {" · "}
              <span className="font-semibold text-destructive">
                연체 {overdueCount}권
              </span>
            </>
          ) : null}
        </span>
      </div>

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
