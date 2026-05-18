import { Suspense } from "react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/layout/page-header";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import type { ClassSection } from "@/types/domain";

import { OperationData, OperationSkeleton } from "./operation-data";

export function generateStaticParams() {
  return CLASS_SECTIONS.map((s) => ({ section: s.id }));
}

export default async function OperationSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: rawSection } = await params;
  const section = decodeURIComponent(rawSection);
  const sectionMeta = CLASS_SECTIONS.find((s) => s.id === section);
  if (!sectionMeta) notFound();

  return (
    <>
      <PageHeader
        title="대여 데스크"
        subtitle={`${sectionMeta.label} · ${sectionMeta.description}`}
      />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <Suspense fallback={<OperationSkeleton sectionId={sectionMeta.id} />}>
            <OperationData
              section={section as ClassSection}
              sectionId={sectionMeta.id}
            />
          </Suspense>
        </div>
      </main>
    </>
  );
}
