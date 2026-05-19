import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { todayIso } from "@/lib/date";
import { getClassStats } from "@/lib/queries/home";

import { ClassCard } from "./class-card";

export default async function OperationHomePage() {
  "use cache";
  cacheTag("students", "loans");
  cacheLife("days");

  const statsBySection = await getClassStats(todayIso());

  return (
    <>
      <PageHeader title="대여 데스크" />
      <main className="flex-1 bg-muted/30 px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <header className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">
              어느 반을 운영할까요?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              선택한 반의 대여·반납 화면이 열립니다
            </p>
          </header>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {CLASS_SECTIONS.map((section) => {
              const stats = statsBySection[section.id];
              return (
                <ClassCard
                  key={section.id}
                  id={section.id}
                  label={section.label}
                  description={section.description}
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
