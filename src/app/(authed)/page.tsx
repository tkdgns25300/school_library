import { PageHeader } from "@/components/layout/page-header";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { getClassStats } from "@/lib/queries/home";

import { ClassCard } from "./class-card";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default async function OperationHomePage() {
  const statsBySection = await getClassStats(todayIso());

  return (
    <>
      <PageHeader title="대여 데스크" subtitle="반 선택 후 대여·반납과 반별 현황" />
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
              const stats = statsBySection[section.id];
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
