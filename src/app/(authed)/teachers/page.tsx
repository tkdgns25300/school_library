import { cacheLife, cacheTag } from "next/cache";

import { PageHeader } from "@/components/layout/page-header";
import { getTeachers } from "@/lib/queries/teachers";

import { TeachersView } from "./teachers-view";

export default async function TeachersPage() {
  "use cache";
  cacheTag("teachers");
  cacheLife("days");

  const teachers = await getTeachers();

  return (
    <>
      <PageHeader title="교사" />
      <main className="flex-1 bg-muted/30 px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          <TeachersView teachers={teachers} />
        </div>
      </main>
    </>
  );
}
