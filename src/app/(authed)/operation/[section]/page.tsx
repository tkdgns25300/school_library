import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { CLASS_SECTIONS } from "@/constants/class-sections";
import { sortStudentsForRoster } from "@/lib/sort/students";
import { createClient } from "@/lib/supabase/server";

import { OperationView } from "./operation-view";

export default async function OperationSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section: rawSection } = await params;
  const section = decodeURIComponent(rawSection);

  const sectionMeta = CLASS_SECTIONS.find((s) => s.id === section);
  if (!sectionMeta) notFound();

  const supabase = await createClient();
  const [studentsRes, teachersRes] = await Promise.all([
    supabase
      .from("students")
      .select("id, name, grade, class_section")
      .eq("class_section", section),
    supabase
      .from("teachers")
      .select("id, name, class_section")
      .order("name"),
  ]);

  const students = sortStudentsForRoster(studentsRes.data ?? []);
  const teachers = teachersRes.data ?? [];

  return (
    <>
      <PageHeader
        title="운영 화면"
        subtitle={`${sectionMeta.label} · ${sectionMeta.description}`}
      />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center gap-3">
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
              학생 {students.length}명
            </span>
          </div>

          <OperationView students={students} teachers={teachers} />
        </div>
      </main>
    </>
  );
}
