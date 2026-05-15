import { PageHeader } from "@/components/layout/page-header";
import { sortStudentsForRoster } from "@/lib/sort/students";
import { createClient } from "@/lib/supabase/server";

import { StudentsView } from "./students-view";

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, name, grade, class_section");

  const students = sortStudentsForRoster(data ?? []);

  return (
    <>
      <PageHeader title="학생" subtitle="전체 명단 · 반별 조회" />
      <main className="flex-1 px-6 py-6">
        <div className="mx-auto max-w-6xl">
          <StudentsView students={students} />
        </div>
      </main>
    </>
  );
}
