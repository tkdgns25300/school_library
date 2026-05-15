import { PageHeader } from "@/components/layout/page-header";
import { ClassCard } from "@/components/operation/class-card";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { createClient } from "@/lib/supabase/server";

type ClassStats = {
  studentCount: number;
  activeCount: number;
  overdueCount: number;
};

export default async function OperationHomePage() {
  const supabase = await createClient();

  const [studentsRes, loansRes] = await Promise.all([
    supabase.from("students").select("id, class_section"),
    supabase
      .from("loans")
      .select("student_id, due_date")
      .is("returned_at", null),
  ]);

  const students = studentsRes.data ?? [];
  const loans = loansRes.data ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const statsBySection = new Map<string, ClassStats>();
  for (const section of CLASS_SECTIONS) {
    const studentIds = new Set(
      students.filter((s) => s.class_section === section.id).map((s) => s.id),
    );
    const sectionLoans = loans.filter((l) => studentIds.has(l.student_id));
    statsBySection.set(section.id, {
      studentCount: studentIds.size,
      activeCount: sectionLoans.length,
      overdueCount: sectionLoans.filter((l) => l.due_date < today).length,
    });
  }

  return (
    <>
      <PageHeader title="운영 화면" subtitle="대여·반납·연체·반별 현황 한눈에" />
      <main className="flex-1 bg-muted/30 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <header className="mb-10 text-center">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              SCHOOL LIBRARY · 더힘스쿨 수지점
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              어느 반을 보고 계세요?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              반을 선택하면 그 반의 대여·반납과 학생별 현황만 보여드립니다.
            </p>
          </header>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {CLASS_SECTIONS.map((section) => {
              const stats = statsBySection.get(section.id);
              return (
                <ClassCard
                  key={section.id}
                  id={section.id}
                  label={section.label}
                  description={section.description}
                  grades={section.grades}
                  studentCount={stats?.studentCount ?? 0}
                  activeCount={stats?.activeCount ?? 0}
                  overdueCount={stats?.overdueCount ?? 0}
                />
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
