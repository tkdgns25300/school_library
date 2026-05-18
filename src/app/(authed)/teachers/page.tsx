import { PageHeader } from "@/components/layout/page-header";
import { getTeachers } from "@/lib/queries/teachers";

import { TeachersView } from "./teachers-view";

export default async function TeachersPage() {
  const teachers = await getTeachers();

  return (
    <>
      <PageHeader title="교사" subtitle="담당자 명단" />
      <main className="flex-1 bg-muted/30 px-6 py-8">
        <div className="mx-auto max-w-6xl">
          <TeachersView teachers={teachers} />
        </div>
      </main>
    </>
  );
}
