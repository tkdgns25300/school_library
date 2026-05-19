import { Suspense } from "react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
      <PageHeader
        title="대여 데스크"
        subtitle={`${sectionMeta.label} · ${sectionMeta.description}`}
      />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
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
              학생 {data.students.length}명 · 대여 중 {data.totalActive}권
              {data.overdueCount > 0 ? (
                <>
                  {" · "}
                  <span className="font-semibold text-destructive">
                    연체 {data.overdueCount}권
                  </span>
                </>
              ) : null}
            </span>
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
