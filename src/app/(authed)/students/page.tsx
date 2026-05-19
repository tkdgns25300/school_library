import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { todayIso } from "@/lib/date";
import { getStudentsWithStats } from "@/lib/queries/students";

import { StudentsView } from "./students-view";

export default async function StudentsPage() {
  "use cache";
  cacheTag("students", "loans", "books");
  cacheLife("days");

  const students = await getStudentsWithStats(todayIso());

  return (
    <>
      <PageHeader title="학생" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <StudentsView students={students} />
        </div>
      </main>
    </>
  );
}
