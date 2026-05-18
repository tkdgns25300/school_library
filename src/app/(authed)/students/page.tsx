import { PageHeader } from "@/components/layout/page-header";
import { getStudentsWithStats } from "@/lib/queries/students";

import { StudentsView } from "./students-view";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function StudentsPage() {
  const students = await getStudentsWithStats(todayIso());

  return (
    <>
      <PageHeader title="학생" subtitle="전체 명단 · 반별 조회" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <StudentsView students={students} />
        </div>
      </main>
    </>
  );
}
