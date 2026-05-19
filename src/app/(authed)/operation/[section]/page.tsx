import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { todayIso } from "@/lib/date";
import { getOperationData } from "@/lib/queries/operation";
import type { ClassSection } from "@/types/domain";

import { OperationView } from "./operation-view";

export function generateStaticParams() {
  return CLASS_SECTIONS.map((s) => ({ section: s.id }));
}

export default async function OperationSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  "use cache";
  cacheTag("students", "teachers", "loans", "books");
  cacheLife("days");

  const { section: rawSection } = await params;
  const section = decodeURIComponent(rawSection);
  const sectionMeta = CLASS_SECTIONS.find((s) => s.id === section);
  if (!sectionMeta) notFound();

  const data = await getOperationData(section as ClassSection, todayIso());

  return (
    <>
      <PageHeader title="대여 데스크" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          {/* Hero header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              반 선택
            </Link>
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-4">
              <h2 className="text-3xl font-bold tracking-tight">
                {sectionMeta.label}
              </h2>
              <div className="text-sm text-muted-foreground">
                학생{" "}
                <span className="font-semibold text-foreground">
                  {data.students.length}명
                </span>{" "}
                · 대여 중{" "}
                <span className="font-semibold text-foreground">
                  {data.totalActive}권
                </span>
                {data.overdueCount > 0 ? (
                  <>
                    {" · "}
                    <span className="font-semibold text-destructive">
                      연체 {data.overdueCount}권
                    </span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <Suspense fallback={null}>
            <OperationView
              section={section as ClassSection}
              students={data.students}
              teachers={data.teachers}
              koLoans={data.koLoans}
              enLoans={data.enLoans}
            />
          </Suspense>
        </div>
      </main>
    </>
  );
}
