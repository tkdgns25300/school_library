import { PageHeader } from "@/components/layout/page-header";
import { ClassCard } from "@/components/operation/class-card";
import { CLASS_SECTIONS } from "@/constants/class-sections";

export default function OperationHomePage() {
  return (
    <>
      <PageHeader
        title="운영 화면"
        subtitle="대여·반납·연체·반별 현황 한눈에"
      />
      <main className="flex-1 px-6 py-10">
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
            {CLASS_SECTIONS.map((section) => (
              <ClassCard key={section.id} {...section} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
