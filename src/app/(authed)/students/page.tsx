"use cache";

import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { getStudentsWithStats } from "@/lib/queries/students";

import { StudentsView } from "./students-view";

export default async function StudentsPage() {
  cacheTag("students", "loans", "books");
  cacheLife({ revalidate: 1800 });

  const today = new Date().toISOString().slice(0, 10);
  const students = await getStudentsWithStats(today);

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
